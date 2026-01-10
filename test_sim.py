import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Add parent directory to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from business_simulator.business_state import BusinessState
from business_simulator.first_order import apply_first_order_effects
from business_simulator.second_order import apply_second_order_effects
from business_simulator.simulator import BusinessSimulator
from business_simulator.monte_carlo import run_monte_carlo

class TestBusinessSimulator(unittest.TestCase):
    
    def setUp(self):
        self.state = BusinessState(
            cac=100.0,
            ltv=500.0,
            arpu=50.0,
            burn=20000.0,
            cash=100000.0,
            revenue=0.0,
            customers=100,
            new_customers=0,
            traffic=1000,
            ad_spend=10000.0,
            runway=0.0
        )

    def test_first_order(self):
        # new_customers = 10000 / 100 = 100
        # customers = 100 + 100 = 200
        # revenue = 200 * 50 = 10000
        # cash = 100000 + 10000 - 20000 - 10000 = 80000
        new_state = apply_first_order_effects(self.state)
        self.assertEqual(new_state.new_customers, 100)
        self.assertEqual(new_state.customers, 200)
        self.assertEqual(new_state.revenue, 10000)
        self.assertEqual(new_state.cash, 80000)

    def test_second_order(self):
        # Setup state for second order
        self.state.ad_spend = 60000 # > 50000 threshold
        self.state.customers = 1000
        
        new_state = apply_second_order_effects(self.state)
        
        # Check CAC efficiency (0.95 multiplier)
        self.assertEqual(new_state.cac, 100.0 * 0.95)
        
        # Check Burn increase (10 per customer)
        # Original burn 20000 + (1000 * 10) = 30000
        self.assertEqual(new_state.burn, 20000 + 10000)

    @patch('business_simulator.monte_carlo.call_gemini_json')
    def test_monte_carlo(self, mock_gemini):
        # Mock Gemini response
        mock_gemini.return_value = {
            "burn_multiplier": 1.0,
            "ARPU_shift": 0.0,
            "CAC_drift": 1.0
        }
        
        results = run_monte_carlo(self.state, {"ad_spend": 10000}, months=3, num_runs=5)
        
        self.assertIn("survival_probability", results)
        self.assertIn("p50", results)
        self.assertEqual(len(results["traces"]), 5)
        self.assertEqual(len(results["traces"][0]), 3)

if __name__ == '__main__':
    unittest.main()
