import copy
import unittest
from service import ReferenceScorer, ROOT
from baseline import read_archive

class Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.scorer=ReferenceScorer()
        d,_=next(read_archive(ROOT/'bot_reference.zip','bot'))
        events=[dict(e) for e in d['events'] if e['timestamp']<30000]
        cls.window=dict(schema_version='2.0',timestamp_unit='milliseconds',duration_ms=30000,events=events)
    def test_real_window(self):
        r=self.scorer.score(self.window)
        self.assertEqual(r['status'],'scored');self.assertTrue(0<=r['risk_score']<=100)
        self.assertFalse(r['enforcement_allowed'])
    def test_missing_keyboard_abstains(self):
        d=copy.deepcopy(self.window);d['events']=[e for e in d['events'] if not e['type'].startswith('key')]
        for i,e in enumerate(d['events']):e['seq']=i
        self.assertIsNone(self.scorer.score(d)['risk_score'])
    def test_empty_abstains(self):
        d=dict(self.window,events=[]);self.assertEqual(self.scorer.score(d)['status'],'insufficient_evidence')
    def test_invalid_order(self):
        d=copy.deepcopy(self.window);d['events'][0]['seq']=5
        with self.assertRaises(ValueError):self.scorer.score(d)
    def test_literal_key_rejected(self):
        d=copy.deepcopy(self.window);d['events'][0]['key']='a'
        with self.assertRaises(ValueError):self.scorer.score(d)
    def test_outside_window(self):
        d=copy.deepcopy(self.window);d['events'][0]['timestamp']=30000
        with self.assertRaises(ValueError):self.scorer.score(d)
if __name__=='__main__':unittest.main()
