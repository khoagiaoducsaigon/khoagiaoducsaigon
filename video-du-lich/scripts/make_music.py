# Tổng hợp nhạc nền vui tươi 60s, 124 BPM, giọng C trưởng (I-V-vi-IV). Không bản quyền.
import numpy as np, wave, sys
SR=44100; BPM=124; DUR=60.0
beat=60/BPM; N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N)
def f(m): return 440*2**((m-69)/12)
def env(n,a=0.005,d=0.15,s=0.6,r=0.08):
    t=np.arange(n)/SR; e=np.ones(n)*s
    ai=int(a*SR); di=int(d*SR); ri=int(r*SR)
    e[:ai]=np.linspace(0,1,ai) if ai else 1
    if di: e[ai:ai+di]=np.linspace(1,s,len(e[ai:ai+di]))
    if ri and n>ri: e[-ri:]*=np.linspace(1,0,ri)
    return e
def add(buf_l,buf_r,start,sig,pan=0.0):
    i=int(start*SR); j=min(N,i+len(sig)); sig=sig[:j-i]
    buf_l[i:j]+=sig*(1-pan)/1; buf_r[i:j]+=sig*(1+pan)/1
def tone(m,dur,kind='sq',vol=0.2,**k):
    n=int(dur*SR); t=np.arange(n)/SR; fr=f(m)
    if kind=='sq': w=np.sign(np.sin(2*np.pi*fr*t))*0.5+0.5*np.sin(2*np.pi*fr*t)
    elif kind=='saw': w=2*((t*fr)%1)-1
    elif kind=='tri': w=2*np.abs(2*((t*fr)%1)-1)-1
    else: w=np.sin(2*np.pi*fr*t)
    return w*env(n,**k)*vol
# drums
def kick():
    n=int(0.25*SR); t=np.arange(n)/SR
    fr=50+120*np.exp(-t*30); ph=2*np.pi*np.cumsum(fr)/SR
    return np.sin(ph)*np.exp(-t*12)*0.9
def snare():
    n=int(0.18*SR); t=np.arange(n)/SR
    return (np.random.randn(n)*0.5+np.sin(2*np.pi*190*t)*0.4)*np.exp(-t*22)*0.45
def hat(o=False):
    n=int((0.12 if o else 0.04)*SR); t=np.arange(n)/SR
    x=np.random.randn(n); x=np.diff(np.concatenate([[0],x]))
    return x*np.exp(-t*(25 if o else 90))*0.12
def clap():
    n=int(0.15*SR); t=np.arange(n)/SR; x=np.random.randn(n)
    e=np.exp(-((t%0.012)*300))*np.exp(-t*20); return x*e*0.25
np.random.seed(7)
prog=[(60,[60,64,67]),(55,[55,59,62]),(57,[57,60,64]),(53,[53,57,60])]  # C G Am F
bars=int(DUR/(beat*4))+1
# melody motifs (scale degrees in semitones, durations in beats)
motA=[(72,0.5),(74,0.5),(76,0.5),(79,0.5),(76,1),(74,0.5),(72,0.5)]
motB=[(74,0.5),(76,0.5),(79,1),(81,0.5),(79,0.5),(76,1)]
motC=[(76,0.5),(76,0.5),(77,0.5),(79,0.5),(81,1),(79,1)]
motD=[(77,0.5),(76,0.5),(74,0.5),(72,0.5),(74,1),(72,1)]
mel=[motA,motB,motC,motD]
for b in range(bars):
    t0=b*4*beat
    if t0>=DUR: break
    root,ch=prog[b%4]
    intro = b<2; outro = t0>DUR-4*beat*1.0
    # bass: bouncy octave 8ths
    for i in range(8):
        m=root-24 + (12 if i%2 else 0)
        add(L,R,t0+i*beat/2,tone(m,beat/2*0.9,'saw',0.11,d=0.08,s=0.5))
    # chords: offbeat stabs
    if not intro:
        for i in range(4):
            for m in ch:
                add(L,R,t0+i*beat+beat/2,tone(m,beat*0.35,'tri',0.06,d=0.1,s=0.4),pan=-0.3)
    # pluck arpeggio
    arp=ch+[ch[0]+12]
    for i in range(16):
        m=arp[i%4]+12
        add(L,R,t0+i*beat/4,tone(m,beat/4,'sin',0.05,d=0.06,s=0.1),pan=0.4)
    # melody
    if b>=2 and not outro:
        tt=t0
        for m,d in mel[b%4]:
            add(L,R,tt,tone(m,d*beat*0.9,'sq',0.07,d=0.1,s=0.5),pan=0.1); tt+=d*beat
    # drums
    for i in range(4):
        tb=t0+i*beat
        add(L,R,tb,kick())
        if i in (1,3) and not intro: add(L,R,tb,snare()); add(L,R,tb,clap())
        for h in range(2):
            add(L,R,tb+h*beat/2,hat(h==1),pan=0.2 if h else -0.2)
mix=np.stack([L,R],1)
# fade in/out
fi=int(0.5*SR); fo=int(2.5*SR)
mix[:fi]*=np.linspace(0,1,fi)[:,None]; mix[-fo:]*=np.linspace(1,0,fo)[:,None]
mix=np.tanh(mix*1.2); mix/=np.abs(mix).max()*1.12
out=sys.argv[1]
with wave.open(out,'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix*32767).astype('<i2').tobytes())
print('ok',out)
