"""
MCTS Engine
===========
Implements Monte Carlo Tree Search to find optimal strategic paths through the simulation.
Uses the SimulationEngine as the environment.
Now tracks SURVIVAL PROBABILITY (Risk Analysis).
"""

import math
import random
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass, field

from simulation_engine import SimulationEngine
from causal_graph_prototype import BusinessState, LaggedEffect
from bet_sizing import MonthlyPolicy

class MCTSNode:
    """Represents a node in the game tree (a specific business state)"""
    def __init__(self, state: BusinessState, lagged_effects: List[LaggedEffect], parent=None, move=None):
        self.state = state
        self.lagged_effects = lagged_effects 
        self.parent: Optional[MCTSNode] = parent
        self.move: Optional[MonthlyPolicy] = move 
        self.children: List[MCTSNode] = []
        
        # MCTS Stats
        self.visits: int = 0
        self.value: float = 0.0
        
        # Risk Stats
        self.survival_wins: int = 0  # Count of rollouts that didn't go bankrupt
        
        self.untried_moves: List[MonthlyPolicy] = [] 

    def is_fully_expanded(self) -> bool:
        return len(self.untried_moves) == 0

    def get_survival_probability(self) -> float:
        """Returns the % of rollouts from this node that survived"""
        if self.visits == 0:
            return 0.0
        return self.survival_wins / self.visits

    def best_child(self, exploration_weight: float = 1.414) -> 'MCTSNode':
        """Selects best child using UCB1 formula"""
        best_score = -float('inf')
        best_check_node = None
        
        for child in self.children:
            exploit = child.value / child.visits
            explore = math.sqrt(math.log(self.visits) / child.visits)
            score = exploit + exploration_weight * explore
            
            if score > best_score:
                best_score = score
                best_check_node = child
                
        return best_check_node

class MCTSEngine:
    def __init__(self, sim_engine: SimulationEngine):
        self.sim = sim_engine

    def run_search(self, root_state: BusinessState, initial_effects: List[LaggedEffect], iterations: int = 1000) -> Tuple[MonthlyPolicy, float]:
        """
        Runs MCTS for N iterations.
        Returns: (Best Move, Survival Probability of that move)
        """
        root_node = MCTSNode(root_state, initial_effects)
        root_node.untried_moves = self.sim.get_legal_moves() 

        for _ in range(iterations):
            node = self._select(root_node)
            score, survived = self._simulate(node)
            self._backpropagate(node, score, survived)

        if not root_node.children:
            moves = self.sim.get_legal_moves()
            return random.choice(moves), 0.0
            
        # Select best move (Robust Child)
        best_node = max(root_node.children, key=lambda c: c.visits)
        return best_node.move, best_node.get_survival_probability()

    def _select(self, node: MCTSNode) -> MCTSNode:
        while not self.sim.is_terminal(node.state):
            if not node.is_fully_expanded():
                return self._expand(node)
            else:
                next_node = node.best_child()
                if next_node is None:
                    return node
                node = next_node
        return node

    def _expand(self, node: MCTSNode) -> MCTSNode:
        move = node.untried_moves.pop()
        new_state, new_effects = self.sim.step(node.state, node.lagged_effects, move)
        child_node = MCTSNode(new_state, new_effects, parent=node, move=move)
        child_node.untried_moves = self.sim.get_legal_moves()
        node.children.append(child_node)
        return child_node

    def _simulate(self, node: MCTSNode) -> Tuple[float, bool]:
        """
        Run a random rollout.
        Returns: (Score, DidSurvive)
        """
        current_state = node.state
        current_effects = node.lagged_effects
        
        # Rollout loop
        while not self.sim.is_terminal(current_state):
            move = random.choice(self.sim.get_legal_moves())
            current_state, current_effects = self.sim.step(current_state, current_effects, move)
            
        # Evaluate final state
        # SimulationEngine.evaluate needs to return BOTH score and survival bool now
        # But to keep API simple, we'll check survival here based on terminal condition
        score = self.sim.evaluate(current_state)
        did_survive = current_state.cash >= 0
        
        return score, did_survive

    def _backpropagate(self, node: MCTSNode, score: float, survived: bool):
        while node is not None:
            node.visits += 1
            node.value += score
            if survived:
                node.survival_wins += 1
            node = node.parent
