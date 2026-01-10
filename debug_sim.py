
from simulation_engine import SimulationEngine
from mcts import MCTSEngine
import traceback

def test():
    print("Testing SimulationEngine...")
    try:
        sim = SimulationEngine()
        moves = sim.get_legal_moves()
        print(f"Legal Moves: {len(moves)} found.")
        for m in moves:
            print(f" - {m.name}")
            
        if not moves:
            print("ERROR: No legal moves found!")
            return

        print("\nTesting MCTSEngine simulation step...")
        mcts = MCTSEngine(sim)
        state, effects = sim.get_initial_state()
        
        # Test simulate single step
        import random
        move = random.choice(moves)
        print(f"Selected random move: {move.name}")
        
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    test()
