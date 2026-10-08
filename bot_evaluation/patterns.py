"""Predefined test patterns, not tuned using model scores."""
import math
PROFILES=('burst_pause','curved_motion','slow_reading')
def timings(profile,rng):
    if profile=='burst_pause':return rng.randint(8,25),rng.randint(5,35),rng.randint(150,450)
    if profile=='curved_motion':return rng.randint(70,160),rng.randint(30,160),rng.randint(300,900)
    if profile=='slow_reading':return rng.randint(90,220),rng.randint(120,350),rng.randint(900,2200)
    raise ValueError('unknown profile')
def motion(profile,start,end,rng):
    if profile not in PROFILES:raise ValueError('unknown profile')
    steps=5 if profile=='burst_pause' else (30 if profile=='curved_motion' else 20)
    bend=rng.uniform(-100,100) if profile=='curved_motion' else 0
    for i in range(1,steps+1):
        t=i/steps
        u=t*t*(3-2*t) if profile=='curved_motion' else t
        x=start[0]+(end[0]-start[0])*u
        y=start[1]+(end[1]-start[1])*u+bend*math.sin(math.pi*t)
        # The endpoint is unchanged; click() subsequently rechecks hit target/stability.
        yield max(0,min(1535,x)),max(0,min(729,y)),(35 if profile=='curved_motion' else (45 if profile=='slow_reading' else 10))
