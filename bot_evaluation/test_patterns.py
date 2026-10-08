import random,unittest
from patterns import PROFILES,motion,timings
class PatternsTest(unittest.TestCase):
 def test_endpoints_and_bounds(self):
  for p in PROFILES:
   points=list(motion(p,(30,50),(900,600),random.Random(123)))
   self.assertAlmostEqual(points[-1][0],900);self.assertAlmostEqual(points[-1][1],600)
   self.assertTrue(all(0<=x<1536 and 0<=y<730 and dt>0 for x,y,dt in points))
 def test_reproducible_parameters(self):
  for p in PROFILES:
   self.assertEqual(timings(p,random.Random(42)),timings(p,random.Random(42)))
   self.assertEqual(list(motion(p,(0,0),(800,600),random.Random(42))),list(motion(p,(0,0),(800,600),random.Random(42))))
 def test_invalid_profile(self):
  with self.assertRaises(ValueError):timings('training_profile',random.Random())
if __name__=='__main__':unittest.main()
