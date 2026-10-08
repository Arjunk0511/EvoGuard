import unittest
from features import extract

def event(seq, timestamp, kind='mousemove', **extra):
    return dict(seq=seq, timestamp=timestamp, type=kind, x=3*seq, y=4*seq,
                page='/', viewport_width=100, viewport_height=100, **extra)
def session(events):
    return dict(events=events, duration_ms=1000, timestamp_unit='milliseconds', schema_version='2.0')
class FeaturesTest(unittest.TestCase):
    def test_mouse_time_and_keyboard_independence(self):
        a=event(0,0); b=event(1,100)
        f,_=extract(session([a,b]))
        self.assertEqual(f['mouse_speed_css_px_s_mean'],50)
        k=event(1,50,'keydown',press_id='p1',key_category='LETTER')
        b['seq']=2
        g,_=extract(session([a,k,b]))
        self.assertEqual(g['mouse_speed_css_px_s_mean'],50)
    def test_boundary_and_equal_time(self):
        f,q=extract(session([event(0,0),event(1,0),event(2,10,'contextchange'),event(3,20)]))
        self.assertIsNone(f['mouse_speed_css_px_s_mean'])
        self.assertEqual(q['zero_dt_mouse_pairs_skipped'],1)
    def test_key_pair(self):
        f,_=extract(session([event(0,10,'keydown',press_id='p1',key_category='LETTER'),event(1,110,'keyup',press_id='p1',key_category='LETTER')]))
        self.assertEqual(f['key_hold_ms_mean'],100)
    def test_backward_rejected(self):
        with self.assertRaises(ValueError):extract(session([event(0,100),event(1,10)]))
if __name__=='__main__':unittest.main()
