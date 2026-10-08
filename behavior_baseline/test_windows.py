import unittest
from baseline import windows
class WindowTest(unittest.TestCase):
 def session(self,events,duration=60000):return dict(schema_version='2.0',timestamp_unit='milliseconds',duration_ms=duration,events=events)
 def key(self,seq,t,kind):return dict(seq=seq,timestamp=t,type=kind,press_id='p1',key_category='LETTER')
 def test_cross_window_hold_excluded(self):
  rows=list(windows(self.session([self.key(0,29990,'keydown'),self.key(1,30010,'keyup')])) )
  self.assertEqual([r[1]['key_hold_ms_count'] for r in rows],[0,0])
  self.assertFalse(any(r[2] for r in rows))
 def test_boundary_event_owned_once(self):
  rows=list(windows(self.session([self.key(0,30000,'keydown')])))
  self.assertEqual([r[1]['keydown_count'] for r in rows],[0,1])
 def test_partial_tail_excluded(self):
  self.assertEqual(len(list(windows(self.session([],59999)))),1)
if __name__=='__main__':unittest.main()
