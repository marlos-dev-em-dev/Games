#!/usr/bin/env python3
"""
Square Rebellion — 2D Vampire Survivors Platformer
"""
import pygame, math, random, sys, json, os

pygame.init(); pygame.font.init()
SW, SH, TS = 1280, 720, 32
SCREEN = pygame.display.set_mode((SW, SH))
pygame.display.set_caption("Square Rebellion")
CLOCK = pygame.time.Clock()
try:
    FONT_S = pygame.font.Font(None, 20)
    FONT_M = pygame.font.Font(None, 28)
    FONT_L = pygame.font.Font(None, 40)
    FONT_XL = pygame.font.Font(None, 56)
except Exception:
    FONT_S = FONT_M = FONT_L = FONT_XL = None

# ═══ SAVE ═══
SAVE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sqrebel_save.json')
SAVE = {'kills': {}, 'achs': [], 'best': 0, 'runs': 0}
def load_save():
    global SAVE
    try:
        with open(SAVE_PATH) as f: SAVE = json.load(f)
    except Exception: SAVE = {'kills': {}, 'achs': [], 'best': 0, 'runs': 0}
def save_disk():
    try:
        with open(SAVE_PATH, 'w') as f: json.dump(SAVE, f)
    except Exception: pass
load_save()

# ═══ CONSTANTS ═══
GROUND_ROW = 19; GRAV = 1400; MAX_FALL = 800; JVEL = -520
PW, PH = 20, 34; COYOTE_T = 0.1; JBUF_T = 0.1; MAG_BASE = 60.0; MAX_TIME = 1800

# ═══ COLORS ═══
BG=(12,10,22); GRND_C=(28,32,48); GRND_E=(48,52,72); PLAT_C=(35,40,58); PLAT_E=(55,60,82)
P_COL=(230,235,245); P_ACC=(78,205,196); P_GLOW=(78,205,196,35); C_TRAIL=(180,185,200)
WHITE=(255,255,255); BLACK=(0,0,0); UI_C=(200,200,210); UI_DIM=(130,130,140)
HP_C=(78,205,196); XP_C=(100,220,100); DMG_F=(200,40,40)
GEM_S=(80,160,255); GEM_M=(80,255,120); GEM_L=(255,180,60)
C_WHIP=(200,200,255); C_ORB=(100,220,255); C_THUN=(255,255,120); C_FIRE=(255,140,40)
C_ICE=(150,200,255); C_POIS=(120,200,80); C_CROSS=(255,220,100); C_GARL=(220,220,180)
C_BONE=(210,190,160); C_MISS=(180,130,255); C_SWORD=(220,220,255); C_SHIELD_W=(100,180,255)
C_WATER=(80,120,220); C_KNIFE=(200,200,210); C_AXE=(180,160,140); C_BIBLE=(255,230,180)
C_PENTA=(255,80,200); C_LAUREL=(120,255,120); C_SPIRAL=(180,80,255); C_SANTA=(80,160,255)
C_ARROW=(255,255,200); C_PINION=(180,120,80); C_SHROUD=(200,50,50); C_RUNE=(150,255,200)
C_PHIER=(255,200,200); C_VAND=(200,160,100); C_MOON=(220,200,255); C_VSWORD=(255,220,220)
C_CORR=(100,255,255)
C_CRAWL=(190,60,60); C_FLY=(150,70,190); C_LEAP=(60,130,200); C_BRUTE=(160,50,40)
C_ARCH_E=(80,180,80); C_SWARM_E=(200,200,60); C_SPLIT=(180,100,200); C_CHRG=(200,140,60)
C_EXPLO=(200,60,120); C_SHIELD_E=(80,120,200); C_NECRO=(100,60,160); C_BOMBER=(180,140,80)
C_GHOST_E=(140,160,200); C_WRAITH=(60,60,80); C_BOSS=(200,50,50); C_MBOSS=(180,80,180)

# ═══ HELPERS ═══
def alp(c,a): return (c[0],c[1],c[2],max(0,min(a,255)))
def lerp(a,b,t): return a+(b-a)*t
def sign(x): return (x>0)-(x<0)
def dst(a,b): return math.hypot(a[0]-b[0],a[1]-b[1])
def mt(cur,tgt,mx):
    if abs(tgt-cur)<=mx: return tgt
    return cur+math.copysign(mx,tgt-cur)
def rtxt(surf,font,text,pos,color,center=False):
    if font is None: return
    try:
        s=font.render(str(text),True,color[:3])
        if len(color)==4: s.set_alpha(color[3])
        if center: surf.blit(s,(pos[0]-s.get_width()//2,pos[1]-s.get_height()//2))
        else: surf.blit(s,pos)
    except Exception: pass

# ═══ INPUT (ESC fix) ═══
class Input:
    def __init__(s): s._h=set(); s._j=set(); s.quit_req=False
    def update(s):
        s._j.clear()
        for e in pygame.event.get():
            if e.type==pygame.QUIT: s.quit_req=True; return
            if e.type==pygame.KEYDOWN: s._h.add(e.key); s._j.add(e.key)
            if e.type==pygame.KEYUP: s._h.discard(e.key)
    def held(s,k): return k in s._h
    def just(s,k): return k in s._j

# ═══ AABB + PHYSICS ═══
class AABB:
    __slots__=['x','y','w','h']
    def __init__(s,x,y,w,h): s.x,s.y,s.w,s.h=x,y,w,h
    @property
    def cx(s): return s.x+s.w*0.5
    @property
    def cy(s): return s.y+s.h*0.5
    def ov(s,o): return s.x<o.x+o.w and s.x+s.w>o.x and s.y<o.y+o.h and s.y+s.h>o.y

def phys_move(pos,vel,w,h,solids,dt):
    gnd=False; pos[0]+=vel[0]*dt; box=AABB(pos[0],pos[1],w,h)
    for sol in solids:
        if not box.ov(sol): continue
        if vel[0]>0: pos[0]=sol.x-w
        elif vel[0]<0: pos[0]=sol.x+sol.w
        vel[0]=0; box.x=pos[0]
    pos[1]+=vel[1]*dt; box.x,box.y=pos[0],pos[1]
    for sol in solids:
        if not box.ov(sol): continue
        if vel[1]>0: pos[1]=sol.y-h; gnd=True
        elif vel[1]<0: pos[1]=sol.y+sol.h
        vel[1]=0; box.y=pos[1]
    return gnd

# ═══ CAMERA ═══
class Camera:
    def __init__(s): s.x=s.y=0.; s.shx=s.shy=0.; s._si=s._st=s._sd=0.
    def update(s,tgt,dt):
        sm=1-math.exp(-dt/0.12); s.x+=(tgt[0]-SW/2-s.x)*sm; s.y+=(tgt[1]-SH/2-s.y)*sm
        if s._st>0:
            s._st-=dt; f=s._si*max(0,s._st/s._sd)
            s.shx=(random.random()*2-1)*f; s.shy=(random.random()*2-1)*f
        else: s.shx=s.shy=0
    def shake(s,i,d): s._si,s._sd,s._st=i,d,d
    @property
    def ox(s): return s.x+s.shx
    @property
    def oy(s): return s.y+s.shy

# ═══ PARTICLES ═══
class Particles:
    N=500
    def __init__(s):
        n=s.N; s.px=[0.]*n; s.py=[0.]*n; s.vx=[0.]*n; s.vy=[0.]*n
        s.life=[0.]*n; s.ml=[0.]*n; s.sz=[0.]*n; s.cr=[0]*n; s.cg=[0]*n
        s.cb=[0]*n; s.ca=[0]*n; s.on=[False]*n
    def _add(s,x,y,vx,vy,life,sz,c):
        for i in range(s.N):
            if s.on[i]: continue
            s.px[i],s.py[i]=x,y; s.vx[i],s.vy[i]=vx,vy; s.life[i]=s.ml[i]=life; s.sz[i]=sz
            s.cr[i],s.cg[i],s.cb[i]=c[0],c[1],c[2]; s.ca[i]=c[3] if len(c)>3 else 255
            s.on[i]=True; return
    def burst(s,p,n,spd,life,sz,c):
        for i in range(max(1,n)):
            a=i/max(1,n)*math.tau; sv=spd*(0.5+0.5*random.random())
            s._add(p[0],p[1],math.cos(a)*sv,math.sin(a)*sv,life,sz,c)
    def directed(s,p,d,n,spread,spd,life,sz,c):
        ba=math.atan2(d[1],d[0])
        for _ in range(n):
            a=ba+(random.random()-0.5)*spread; sv=spd*(0.6+0.4*random.random())
            s._add(p[0],p[1],math.cos(a)*sv,math.sin(a)*sv,life,sz,c)
    def dust(s,p,n,spd,c):
        for _ in range(n):
            a=-math.pi*0.5+(random.random()-0.5)*math.pi*0.8; sv=spd*(0.4+0.6*random.random())
            s._add(p[0],p[1],math.cos(a)*sv,math.sin(a)*sv,0.2+random.random()*0.2,2+random.random()*2,c)
    def update(s,dt):
        for i in range(s.N):
            if not s.on[i]: continue
            s.px[i]+=s.vx[i]*dt; s.py[i]+=s.vy[i]*dt; s.vx[i]*=0.97; s.vy[i]*=0.97
            s.life[i]-=dt
            if s.life[i]<=0: s.on[i]=False
    def draw(s,surf,cam):
        ox,oy=cam.ox,cam.oy
        for i in range(s.N):
            if not s.on[i]: continue
            t=s.life[i]/max(0.01,s.ml[i]); sz=s.sz[i]*(0.3+0.7*t)
            a=max(0,min(int(t*t*s.ca[i]),255))
            if sz<0.5 or a<1: continue
            r=max(1,int(sz*0.5)); sf=pygame.Surface((r*2,r*2),pygame.SRCALPHA)
            pygame.draw.circle(sf,(s.cr[i],s.cg[i],s.cb[i],a),(r,r),r)
            surf.blit(sf,(int(s.px[i]-r-ox),int(s.py[i]-r-oy)))

# ═══ WORLD ═══
class World:
    def __init__(s): s.solids=[]; s.chunks={}
    def update(s,cam_x):
        ck=int(cam_x//320)
        for c in range(ck-5,ck+6):
            if c not in s.chunks: s._gen(c)
        for c in [c for c in s.chunks if abs(c-ck)>8]:
            for r in s.chunks.pop(c):
                if r in s.solids: s.solids.remove(r)
    def _gen(s,c):
        x0=c*320; rects=[]; gy=GROUND_ROW*TS
        g=AABB(x0,gy,320,3*TS); rects.append(g); s.solids.append(g)
        if random.random()<0.75:
            n=random.randint(1,3); used=set()
            for _ in range(n):
                rows=[(16,[3,4,5,6]),(15,[3,4,5]),(14,[3,4]),(13,[3,4])]
                row,ws=random.choice(rows)
                if row in used: continue
                used.add(row); px=x0+random.randint(0,200); pw=random.choice(ws)*TS
                p=AABB(px,row*TS,pw,14); rects.append(p); s.solids.append(p)
        s.chunks[c]=rects
    def draw(s,surf,cam):
        ox,oy=cam.ox,cam.oy; gs=TS*4; x=-ox%gs
        while x<SW: pygame.draw.line(surf,(25,25,42),(int(x),0),(int(x),SH)); x+=gs
        y=-oy%gs
        while y<SH: pygame.draw.line(surf,(25,25,42),(0,int(y)),(SW,int(y))); y+=gs
        for sol in s.solids:
            sx,sy=sol.x-ox,sol.y-oy
            if sx+sol.w<-TS or sx>SW+TS: continue
            if sol.h>TS:
                pygame.draw.rect(surf,GRND_C,(int(sx),int(sy),int(sol.w),int(sol.h)))
                pygame.draw.rect(surf,GRND_E,(int(sx),int(sy),int(sol.w),3))
            else:
                pygame.draw.rect(surf,PLAT_C,(int(sx),int(sy),int(sol.w),int(sol.h)))
                pygame.draw.rect(surf,PLAT_E,(int(sx),int(sy),int(sol.w),2))

# ═══ GEM ═══
class Gem:
    def __init__(s,x,y,value):
        s.pos=[float(x),float(y)]; s.value=value; s.active=True
        s.sz={1:4,3:6,10:8}.get(value,4)
        s.color={1:GEM_S,3:GEM_M,10:GEM_L}.get(value,GEM_S)
        s.vy=random.uniform(-150,-60); s.vx=random.uniform(-40,40); s.attract=False
    def update(s,pctr,mag,dt):
        if not s.active: return
        s.vy+=600*dt; s.pos[0]+=s.vx*dt; s.pos[1]+=s.vy*dt
        gy=GROUND_ROW*TS
        if s.pos[1]>gy: s.pos[1]=gy; s.vy=0; s.vx*=0.8
        if dst(s.pos,pctr)<mag: s.attract=True
        if s.attract:
            dx=pctr[0]-s.pos[0]; dy=pctr[1]-s.pos[1]; d2=max(1,math.hypot(dx,dy))
            s.pos[0]+=(dx/d2)*450*dt; s.pos[1]+=(dy/d2)*450*dt
    def draw(s,surf,cam):
        if not s.active: return
        x,y=int(s.pos[0]-cam.ox),int(s.pos[1]-cam.oy); sz=s.sz
        pts=[(x,y-sz),(x+sz,y),(x,y+sz),(x-sz,y)]
        pygame.draw.polygon(surf,s.color,pts); pygame.draw.circle(surf,WHITE,(x,y),max(1,sz//3))

# ═══ ENEMY TYPES ═══
(E_CRAWL,E_FLY,E_LEAP,E_BRUTE,E_ARCH,E_SWARM,E_SPLIT,E_CHRG,
 E_EXPLO,E_SHIELD,E_NECRO,E_BOMBER,E_GHOST,E_WRAITH)=range(14)
MB_DRAGON,MB_BAT,MB_DKNIGHT=14,15,16
MB_LICH,MB_SBEAST,MB_CKNIGHT=17,18,19
MB_WORM,MB_GUARDIAN,MB_REAVER=20,21,22
BOSS_DEMON,BOSS_VOID,BOSS_ENDLESS=23,24,25
MB_TYPES=set(range(14,23)); BOSS_TYPES=set(range(23,26))

ENEMY_NAMES={
    0:'Rastejante',1:'Voador',2:'Saltador',3:'Bruto',4:'Arqueiro',
    5:'Enxame',6:'Divisor',7:'Carga',8:'Explosor',
    9:'Porta-Escudo',10:'Necromante',11:'Bombardeiro',12:'Fantasma',
    13:'Espectro',14:'Dragão de Osso',15:'Morcego Gigante',16:'Cavaleiro Demônio',
    17:'Lich',18:'Fera das Sombras',19:'Cavaleiro Amaldiçoado',20:'Verme Abissal',
    21:'Guardião do Vazio',22:'Ceifador de Almas',23:'Lorde Demônio',
    24:'Imperador do Vazio',25:'O Infinito'}

# All enemies are SQUARES — player is the only rectangle
E_DATA={
    0:{'w':26,'h':26,'hp':15,'spd':70,'dmg':1,'xp':3,'c':C_CRAWL,'c2':(255,120,120)},
    1:{'w':22,'h':22,'hp':10,'spd':95,'dmg':1,'xp':5,'c':C_FLY,'c2':(210,150,255)},
    2:{'w':26,'h':26,'hp':20,'spd':55,'dmg':2,'xp':8,'c':C_LEAP,'c2':(120,190,255)},
    3:{'w':34,'h':34,'hp':50,'spd':38,'dmg':3,'xp':20,'c':C_BRUTE,'c2':(220,90,70)},
    4:{'w':24,'h':24,'hp':12,'spd':50,'dmg':2,'xp':6,'c':C_ARCH_E,'c2':(140,230,140)},
    5:{'w':16,'h':16,'hp':5,'spd':130,'dmg':1,'xp':2,'c':C_SWARM_E,'c2':(255,255,120)},
    6:{'w':26,'h':26,'hp':25,'spd':60,'dmg':2,'xp':8,'c':C_SPLIT,'c2':(220,160,240)},
    7:{'w':28,'h':28,'hp':30,'spd':45,'dmg':3,'xp':10,'c':C_CHRG,'c2':(255,200,100)},
    8:{'w':24,'h':24,'hp':18,'spd':65,'dmg':2,'xp':6,'c':C_EXPLO,'c2':(255,120,160)},
    9:{'w':28,'h':28,'hp':35,'spd':45,'dmg':2,'xp':10,'c':C_SHIELD_E,'c2':(120,160,240)},
    10:{'w':26,'h':26,'hp':20,'spd':40,'dmg':1,'xp':15,'c':C_NECRO,'c2':(160,120,220)},
    11:{'w':26,'h':26,'hp':18,'spd':50,'dmg':2,'xp':8,'c':C_BOMBER,'c2':(230,200,130)},
    12:{'w':24,'h':24,'hp':15,'spd':80,'dmg':2,'xp':7,'c':C_GHOST_E,'c2':(190,210,240)},
    13:{'w':28,'h':28,'hp':25,'spd':100,'dmg':3,'xp':12,'c':C_WRAITH,'c2':(120,120,150)},
    # Mini-bosses (can be non-square)
    14:{'w':60,'h':50,'hp':200,'spd':60,'dmg':4,'xp':100,'c':(180,80,60),'c2':(240,140,100)},
    15:{'w':50,'h':40,'hp':150,'spd':100,'dmg':3,'xp':80,'c':(120,60,160),'c2':(180,120,220)},
    16:{'w':40,'h':55,'hp':250,'spd':50,'dmg':5,'xp':120,'c':(60,60,120),'c2':(100,100,180)},
    17:{'w':36,'h':50,'hp':200,'spd':40,'dmg':4,'xp':130,'c':(80,120,80),'c2':(140,180,140)},
    18:{'w':45,'h':45,'hp':220,'spd':90,'dmg':5,'xp':110,'c':(40,40,60),'c2':(80,80,100)},
    19:{'w':42,'h':55,'hp':280,'spd':45,'dmg':5,'xp':140,'c':(100,60,60),'c2':(160,120,120)},
    20:{'w':70,'h':35,'hp':300,'spd':55,'dmg':6,'xp':160,'c':(100,80,60),'c2':(160,140,100)},
    21:{'w':44,'h':52,'hp':260,'spd':65,'dmg':5,'xp':150,'c':(60,100,140),'c2':(100,160,200)},
    22:{'w':40,'h':48,'hp':250,'spd':80,'dmg':6,'xp':170,'c':(80,40,80),'c2':(140,80,140)},
    # Bosses
    23:{'w':60,'h':70,'hp':800,'spd':45,'dmg':5,'xp':500,'c':(180,30,30),'c2':(255,80,80)},
    24:{'w':70,'h':80,'hp':2000,'spd':50,'dmg':7,'xp':1000,'c':(60,20,80),'c2':(120,60,160)},
    25:{'w':80,'h':90,'hp':5000,'spd':55,'dmg':10,'xp':0,'c':(20,20,30),'c2':(60,60,80)},
}

# ═══ ENEMY CLASS ═══
class Enemy:
    def __init__(s,x,y,etype,t=0):
        d=E_DATA[etype]; s.pos=[float(x),float(y)]; s.vel=[0.,0.]
        s.w,s.h=d['w'],d['h']; sc=1.0+t/90.0
        s.hp=s.mhp=max(1,int(d['hp']*sc)); s.spd=d['spd']
        s.dmg=d['dmg']+int(t/120); s.xp=d['xp']
        s.col,s.col2=d['c'],d['c2']; s.et=etype
        s.active=True; s.gnd=False; s.hf=0.; s.at=random.random()*10
        s.sq_x=s.sq_y=1.0; s.pdir=sign(random.uniform(-1,1))
        s.hop_t=1.+random.random()*1.5; s.state=0; s.state_t=0.
        s.proj=[]; s.is_boss=etype in BOSS_TYPES; s.is_mb=etype in MB_TYPES
        s.phase=0; s.atk_cd=2.; s.summon_cd=5.; s.special_cd=8.
        s.shield_hp=35 if etype==E_SHIELD else 0; s.frozen=0.
    @property
    def cx(s): return s.pos[0]+s.w*0.5
    @property
    def cy(s): return s.pos[1]+s.h*0.5
    @property
    def ctr(s): return (s.cx,s.cy)
    @property
    def box(s): return AABB(s.pos[0],s.pos[1],s.w,s.h)
    def take_hit(s,dmg,kb=(0,0)):
        if s.shield_hp>0: s.shield_hp-=dmg; return
        s.hp-=dmg; s.hf=0.12; s.vel[0]+=kb[0]; s.vel[1]+=kb[1]
        if s.hp<=0: s.active=False
    def update(s,pctr,solids,dt,enemies=None):
        if not s.active: return
        s.hf-=dt; s.at+=dt; s.state_t+=dt; s.frozen-=dt
        s.sq_x=lerp(s.sq_x,1.,10*dt); s.sq_y=lerp(s.sq_y,1.,10*dt)
        for p in s.proj:
            p[0]+=p[2]*dt; p[1]+=p[3]*dt
            if len(p)>5 and p[5]: p[3]+=GRAV*dt
            p[4]-=dt
        s.proj=[p for p in s.proj if p[4]>0]
        if s.frozen>0:
            s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.vel[0]*=0.9; phys_move(s.pos,s.vel,s.w,s.h,solids,dt); return
        dx=pctr[0]-s.cx; dy=pctr[1]-s.cy; dist=max(1,math.hypot(dx,dy)); et=s.et
        if et in (E_CRAWL,E_SPLIT,E_EXPLO,E_BRUTE,E_SHIELD): s._walk(dx,dy,dist,solids,dt)
        elif et in (E_FLY,E_GHOST,E_NECRO): s._fly(dx,dy,dist,dt)
        elif et==E_LEAP: s._leap(dx,dy,dist,solids,dt)
        elif et==E_ARCH: s._archer(dx,dy,dist,solids,dt)
        elif et==E_SWARM: s._swarm(dx,dy,dist,dt)
        elif et==E_CHRG: s._charger(dx,dy,dist,solids,dt)
        elif et==E_BOMBER: s._bomber(dx,dy,dist,solids,dt)
        elif et==E_WRAITH: s._wraith(dx,dy,dist,solids,pctr,dt)
        elif et in MB_TYPES or et in BOSS_TYPES: s._boss_ai(dx,dy,dist,solids,pctr,dt,enemies)
        if s.et==E_NECRO and enemies: s._necro_revive(enemies,dt)
    def _walk(s,dx,dy,dist,solids,dt):
        s.vel[0]=sign(dx)*s.spd; s.vel[1]+=GRAV*dt
        if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
        s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
    def _fly(s,dx,dy,dist,dt):
        d2=max(1,dist); s.pos[0]+=(dx/d2)*s.spd*dt; s.pos[1]+=(dy/d2)*s.spd*dt
        s.pos[1]+=math.sin(s.at*3)*0.5
    def _leap(s,dx,dy,dist,solids,dt):
        s.vel[0]=sign(dx)*s.spd; s.vel[1]+=GRAV*dt
        if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
        s.hop_t-=dt
        if s.gnd and s.hop_t<=0:
            s.vel[1]=JVEL*0.9; s.vel[0]=sign(dx)*s.spd*2.5; s.gnd=False
            s.hop_t=0.8+random.random()*1.2; s.sq_x,s.sq_y=0.7,1.4
        s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
    def _archer(s,dx,dy,dist,solids,dt):
        if dist>250: s._walk(dx,dy,dist,solids,dt)
        else:
            s.vel[0]*=0.9; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
        if dist<400 and s.state_t>2.0:
            s.state_t=0; spd=300; sdx,sdy=dx/dist,dy/dist
            s.proj.append([s.cx,s.cy,sdx*spd,sdy*spd,3.])
    def _swarm(s,dx,dy,dist,dt):
        d2=max(1,dist); s.pos[0]+=(dx/d2)*s.spd*dt; s.pos[1]+=(dy/d2)*s.spd*dt
        s.pos[0]+=math.sin(s.at*8)*0.8; s.pos[1]+=math.cos(s.at*6)*0.5
    def _charger(s,dx,dy,dist,solids,dt):
        if s.state==0:
            s._walk(dx,dy,dist,solids,dt)
            if dist<200 and s.state_t>1.5: s.state=1; s.state_t=0; s.pdir=sign(dx)
        else:
            s.vel[0]=s.pdir*s.spd*4; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            if s.state_t>0.8: s.state=0; s.state_t=0
    def _bomber(s,dx,dy,dist,solids,dt):
        if dist>200: s._walk(dx,dy,dist,solids,dt)
        else:
            s.vel[0]*=0.9; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
        if s.state_t>2.5:
            s.state_t=0; s.proj.append([s.cx,s.cy,dx/dist*150,-350.,2.,True])
    def _wraith(s,dx,dy,dist,solids,pctr,dt):
        s._walk(dx,dy,dist,solids,dt); s.special_cd-=dt
        if s.special_cd<=0:
            s.special_cd=3.+random.random()*2.; a=random.random()*math.tau; r=100+random.random()*100
            s.pos[0]=pctr[0]+math.cos(a)*r; s.pos[1]=pctr[1]+math.sin(a)*r-50
    def _necro_revive(s,enemies,dt):
        if s.state_t>4.:
            s.state_t=0
            for e in enemies:
                if not e.active and not e.is_boss and not e.is_mb:
                    if dst(s.ctr,e.ctr)<200: e.active=True; e.hp=e.mhp//2; break
    def _boss_ai(s,dx,dy,dist,solids,pctr,dt,enemies):
        s.atk_cd-=dt; s.summon_cd-=dt; s.special_cd-=dt
        hp_r=s.hp/s.mhp
        if hp_r<0.5 and s.phase==0: s.phase=1
        if hp_r<0.25 and s.phase==1 and s.et==BOSS_ENDLESS: s.phase=2
        s.vel[0]=sign(dx)*s.spd; s.vel[1]+=GRAV*dt
        if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
        s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
        if s.atk_cd<=0:
            s.atk_cd=max(1.,3.-s.phase*0.5)
            n=(4 if s.et==BOSS_DEMON else 3 if s.et==BOSS_VOID else 6)+s.phase*3
            for i in range(n):
                a=i/n*math.tau+s.at*0.3*(1 if s.et==BOSS_ENDLESS else 0); sp=200+s.phase*50
                s.proj.append([s.cx,s.cy,math.cos(a)*sp,math.sin(a)*sp,3.])
        if s.summon_cd<=0:
            s.summon_cd=max(3.,8.-s.phase*2)
            if enemies is not None:
                types=[E_CRAWL,E_FLY,E_LEAP]
                for _ in range(2+s.phase*2):
                    enemies.append(Enemy(s.cx+random.uniform(-100,100),s.cy+random.uniform(-50,50),random.choice(types)))
        if s.special_cd<=0:
            s.special_cd=max(4.,10.-s.phase*2)
            if s.et==BOSS_DEMON: s.vel[0]=sign(dx)*s.spd*5
            elif s.et==BOSS_VOID: s.pos[0]=pctr[0]-sign(dx)*100; s.pos[1]=pctr[1]-50
            elif s.et==BOSS_ENDLESS:
                for a in range(12):
                    ang=a/12*math.tau; s.proj.append([s.cx,s.cy,math.cos(ang)*250,math.sin(ang)*250,3.])
    def draw(s,surf,cam):
        if not s.active: return
        ox,oy=cam.ox,cam.oy; x,y=s.pos[0]-ox,s.pos[1]-oy
        dw,dh=s.w*s.sq_x,s.h*s.sq_y; dx2=x+(s.w-dw)*0.5; dy2=y+(s.h-dh)
        c=s.col2 if s.hf>0 else s.col
        if s.frozen>0: c=(min(255,c[0]+60),min(255,c[1]+60),min(255,c[2]+100))
        # All enemies drawn as squares (since w==h for regular enemies)
        pygame.draw.rect(surf,c,(int(dx2),int(dy2),int(dw),int(dh)),border_radius=4)
        if s.is_boss:
            aura=pygame.Surface((int(dw)+20,int(dh)+20),pygame.SRCALPHA)
            pygame.draw.ellipse(aura,alp(c,40),(0,0,int(dw)+20,int(dh)+20))
            surf.blit(aura,(int(dx2)-10,int(dy2)-10))
        # Inner detail
        sc2=tuple(min(255,c[i]+35) for i in range(3))
        if s.et==E_BRUTE:
            for i in range(3):
                ly=int(dy2+dh*0.2)+i*int(dh*0.22)
                pygame.draw.rect(surf,sc2,(int(dx2+3),ly,int(dw-6),2))
        elif s.et==E_SHIELD and s.shield_hp>0:
            shx=int(dx2+dw) if s.pdir>0 else int(dx2-6)
            pygame.draw.rect(surf,(100,150,255),(shx,int(dy2+2),6,int(dh-4)),border_radius=2)
        # Eyes
        ey=int(dy2+dh*0.3); ed=4 if (s.is_boss or s.is_mb) else 3
        ecx=int(dx2+dw*0.3); erx=int(dx2+dw*0.7)
        pygame.draw.circle(surf,WHITE,(ecx,ey),ed); pygame.draw.circle(surf,WHITE,(erx,ey),ed)
        pd=sign(s.vel[0]) if abs(s.vel[0])>10 else 0
        pygame.draw.circle(surf,(30,30,30),(ecx+pd,ey),max(1,ed-1))
        pygame.draw.circle(surf,(30,30,30),(erx+pd,ey),max(1,ed-1))
        # HP bar
        if s.hp<s.mhp and s.hp>0:
            bw2=max(s.w+8,40) if (s.is_boss or s.is_mb) else s.w+8
            bx3=s.pos[0]-ox-(bw2-s.w)*0.5; by3=dy2-10
            pygame.draw.rect(surf,(50,50,60),(int(bx3),int(by3),int(bw2),4))
            pygame.draw.rect(surf,s.col,(int(bx3),int(by3),max(1,int(bw2*s.hp/s.mhp)),4))
        # Projectiles
        for p in s.proj:
            px2,py2=int(p[0]-ox),int(p[1]-oy)
            col_p=(255,100,100) if s.is_boss else (200,200,100)
            pygame.draw.circle(surf,col_p,(px2,py2),6 if s.is_boss else 4)

# ═══ ATTACK OBJECT ═══
class AtkObj:
    def __init__(s,x,y,w,h,dmg,life,color,vel=None,kb=(0,0),
                 piercing=False,expand=0,grav=0,hit_cd=0,homing=0,
                 boomerang=False,freeze_dur=0):
        s.pos=[x,y]; s.vel=list(vel or [0,0]); s.w=w; s.h=h
        s.dmg=dmg; s.life=life; s.max_life=life; s.color=color
        s.kb=kb; s.piercing=piercing; s.hit=set(); s.active=True; s.age=0.
        s.expand=expand; s.grav=grav; s.hit_cd=hit_cd; s.homing=homing
        s.boomerang=boomerang; s.origin=[x,y]; s.freeze_dur=freeze_dur
        s.hit_times={}
    @property
    def box(s): return AABB(s.pos[0],s.pos[1],s.w,s.h)
    def update(s,dt,enemies=None):
        s.pos[0]+=s.vel[0]*dt; s.pos[1]+=s.vel[1]*dt; s.vel[1]+=s.grav*dt
        if s.homing and enemies:
            best=None; bd=400
            for e in enemies:
                if not e.active or id(e) in s.hit: continue
                d=dst(s.pos,e.ctr)
                if d<bd: bd=d; best=e
            if best:
                dx=best.cx-s.pos[0]; dy=best.cy-s.pos[1]; d2=max(1,math.hypot(dx,dy))
                s.vel[0]+=(dx/d2)*s.homing*dt*3; s.vel[1]+=(dy/d2)*s.homing*dt*3
                sp=math.hypot(s.vel[0],s.vel[1])
                if sp>s.homing: s.vel[0]*=s.homing/sp; s.vel[1]*=s.homing/sp
        if s.boomerang and s.age>s.max_life*0.4:
            dx=s.origin[0]-s.pos[0]; dy=s.origin[1]-s.pos[1]; d2=max(1,math.hypot(dx,dy))
            s.vel[0]+=(dx/d2)*800*dt; s.vel[1]+=(dy/d2)*800*dt
        if s.expand:
            s.w+=s.expand*dt; s.h+=s.expand*dt
            s.pos[0]-=s.expand*dt*0.5; s.pos[1]-=s.expand*dt*0.5
        s.life-=dt; s.age+=dt
        if s.life<=0: s.active=False
# ═══ WEAPON DEFINITIONS (30) ═══
WD=[
    {'id':'whip','n':'Chicote Vazio','d':'Varredura horizontal','c':C_WHIP,'t':'melee','ml':8,
     'cd':(.9,-.05),'dm':(10,7),'w':(55,8),'h':(32,3),'kb':(220,-90,20,-8),'dr':(.2,0)},
    {'id':'phier','n':'Phieraggi','d':'Cortes multidirecionais','c':C_PHIER,'t':'melee','ml':8,
     'cd':(.5,-.03),'dm':(8,5),'w':(40,6),'h':(40,6),'kb':(180,-80,15,-6),'dr':(.18,0),'dir':4},
    {'id':'vsword','n':'Espada Vitória','d':'Poderoso corte combo','c':C_VSWORD,'t':'melee','ml':8,
     'cd':(.6,-.04),'dm':(15,10),'w':(50,8),'h':(35,4),'kb':(250,-100,25,-10),'dr':(.22,0)},
    {'id':'ice','n':'Lâmina de Gelo','d':'Projétil perfurante de gelo','c':C_ICE,'t':'proj','ml':8,
     'cd':(.8,-.05),'dm':(8,5),'ct':(1,.3),'sp':(350,20),'dr':(.8,.05),'pr':True,'kb':(100,-50)},
    {'id':'knife','n':'Conjunto de Facas','d':'Facas rápidas para frente','c':C_KNIFE,'t':'proj','ml':8,
     'cd':(.4,-.03),'dm':(6,4),'ct':(1,.5),'sp':(400,30),'dr':(.6,.03),'spr':5},
    {'id':'axe','n':'Arremesso de Machado','d':'Machados em arco','c':C_AXE,'t':'proj','ml':8,
     'cd':(1.0,-.06),'dm':(15,10),'ct':(1,.3),'sp':(250,15),'dr':(1.0,.05),'grv':-400},
    {'id':'bone','n':'Arremesso de Osso','d':'Ossos perfurantes','c':C_BONE,'t':'proj','ml':8,
     'cd':(.7,-.04),'dm':(10,6),'ct':(1,.3),'sp':(300,20),'dr':(.8,.05),'pr':True},
    {'id':'arrow','n':'Seta Relâmpago','d':'Seta muito rápida','c':C_ARROW,'t':'proj','ml':8,
     'cd':(.5,-.03),'dm':(12,8),'ct':(1,.3),'sp':(600,40),'dr':(.5,.03),'kb':(150,-50)},
    {'id':'rune','n':'Runa Traçante','d':'Runa ricocheteante','c':C_RUNE,'t':'proj','ml':8,
     'cd':(.9,-.05),'dm':(10,7),'ct':(1,.3),'sp':(280,15),'dr':(1.5,.1),'pr':True},
    {'id':'tedge','n':'Mil Lâminas','d':'Múltiplos projéteis rápidos','c':C_KNIFE,'t':'proj','ml':8,
     'cd':(.3,-.02),'dm':(5,3),'ct':(3,.5),'sp':(500,30),'dr':(.4,.02),'spr':8},
    {'id':'missile','n':'Míssil Mágico','d':'Projéteis teleguiados','c':C_MISS,'t':'homing','ml':8,
     'cd':(1.2,-.07),'dm':(8,5),'ct':(2,.5),'sp':(300,20),'dr':(1.0,.05),'kb':(80,-40),'hm':300},
    {'id':'cross','n':'Cruz','d':'Cruz bumerangue','c':C_CROSS,'t':'proj','ml':8,
     'cd':(1.0,-.06),'dm':(12,8),'ct':(1,.3),'sp':(350,20),'dr':(1.2,.08),'pr':True,'br':True},
    {'id':'fire_ring','n':'Anel de Fogo','d':'Anel em expansão de fogo','c':C_FIRE,'t':'area','ml':8,
     'cd':(3.0,-.2),'dm':(8,5),'sp':(220,30),'mxr':(90,15),'kb':(0,-60)},
    {'id':'holy_bible','n':'Bíblia Sagrada','d':'Bíblias orbitantes','c':C_BIBLE,'t':'orbit','ml':8,
     'cd':(3.5,-.2),'dm':(10,7),'ct':(2,.5),'rad':(60,10),'spd':(2.0,.2),'dur':(4.0,.3),'kb':(100,-50),'sz':(12,2)},
    {'id':'pentagram','n':'Pentagrama','d':'Explosão de área grande','c':C_PENTA,'t':'area','ml':8,
     'cd':(6.0,-.4),'dm':(30,20),'sp':(0,0),'mxr':(200,25),'kb':(0,-200)},
    {'id':'santa_water','n':'Água Santa','d':'Gotas caem do céu','c':C_WATER,'t':'rain','ml':8,
     'cd':(1.5,-.1),'dm':(8,5),'ct':(3,.5),'sp':(300,20),'dr':(1.0,.08),'kb':(30,-80)},
    {'id':'laurel','n':'Louro','d':'Pulso de barreira protetora','c':C_LAUREL,'t':'shield','ml':8,
     'cd':(5.0,-.3),'dm':(0,0),'dur':(2.0,.2),'sp':(0,0)},
    {'id':'soul_orbit','n':'Órbita de Almas','d':'Projéteis orbitantes','c':C_ORB,'t':'orbit_proj','ml':8,
     'cd':(0,0),'dm':(5,3),'ct':(2,.3),'rad':(55,8),'spd':(2.5,.3),'sz':(8,1)},
    {'id':'clock_lancet','n':'Lanceta','d':'Raio congelante','c':C_ICE,'t':'beam','ml':8,
     'cd':(3.0,-.2),'dm':(0,0),'dr':(1.5,.1),'frz':(2.0,.2),'sp':(500,30)},
    {'id':'summon_bat','n':'Enxame de Morcegos','d':'Invoca aliados morcegos','c':C_FLY,'t':'summon','ml':8,
     'cd':(4.0,-.3),'dm':(6,4),'ct':(2,.5),'dur':(5.0,.4),'sp':(200,15),'sz':10},
    {'id':'summon_skel','n':'Exército Esqueleto','d':'Invoca esqueletos','c':C_BONE,'t':'summon','ml':8,
     'cd':(6.0,-.4),'dm':(10,7),'ct':(1,.3),'dur':(6.0,.5),'sp':(80,8),'sz':16},
    {'id':'summon_gear','n':'Engrenagem Guardiã','d':'Aliado escudo flutuante','c':C_SHIELD_W,'t':'summon','ml':8,
     'cd':(8.0,-.5),'dm':(8,5),'ct':(1,.2),'dur':(8.0,.5),'sp':(60,5),'sz':14},
    {'id':'thunder','n':'Raio','d':'Relâmpago no mais próximo','c':C_THUN,'t':'lightning','ml':8,
     'cd':(2.5,-.15),'dm':(25,15),'rng':(250,30),'rad':(35,5),'kb':(0,-200)},
    {'id':'poison','n':'Nuvem Venenosa','d':'Névoa tóxica persistente','c':C_POIS,'t':'area','ml':8,
     'cd':(3.0,-.2),'dm':(4,3),'sp':(0,0),'mxr':(80,10),'dr':(3.0,.3),'kb':(0,0)},
    {'id':'moonlight','n':'Luar','d':'Amplo corte em arco','c':C_MOON,'t':'melee','ml':8,
     'cd':(1.5,-.08),'dm':(18,12),'w':(80,10),'h':(60,8),'kb':(180,-120,15,-10),'dr':(.25,0)},
    {'id':'corridor','n':'Corredor Infinito','d':'Laser para frente','c':C_CORR,'t':'laser','ml':8,
     'cd':(4.0,-.3),'dm':(20,15),'dr':(1.0,.08),'sp':(0,0),'kb':(50,0)},
    {'id':'vandal','n':'Espada Vândala','d':'Golpe massivo no chão','c':C_VAND,'t':'melee','ml':8,
     'cd':(2.5,-.15),'dm':(30,20),'w':(100,15),'h':(50,8),'kb':(300,-150,30,-15),'dr':(.3,0)},
    {'id':'shroud','n':'Mortalha Sangrenta','d':'Pulso de sangue','c':C_SHROUD,'t':'area','ml':8,
     'cd':(2.0,-.12),'dm':(12,8),'sp':(0,0),'mxr':(120,15),'kb':(60,-40)},
    {'id':'pinion','n':'Pena Sombria','d':'Rastro ao se mover','c':C_PINION,'t':'trail','ml':8,
     'cd':(.15,-.005),'dm':(5,3),'dr':(1.5,.1),'sp':(0,0),'kb':(50,-30)},
]

# ═══ KNOWLEDGE DEFINITIONS (12) ═══
KNOW=[
    {'id':'vitality','n':'Vitalidade','d':'+25 Vida Máx','c':HP_C,'mx':5},
    {'id':'might','n':'Poder','d':'+15% Dano','c':(220,80,80),'mx':5},
    {'id':'speed','n':'Velocidade','d':'+15% Velocidade','c':(80,220,80),'mx':5},
    {'id':'haste','n':'Rapidez','d':'-15% Recargas','c':(80,180,220),'mx':5},
    {'id':'armor','n':'Armadura','d':'+1 Armadura','c':(180,180,180),'mx':5},
    {'id':'magnet','n':'Ímã','d':'+40% Alcance','c':(200,160,255),'mx':5},
    {'id':'growth','n':'Crescimento','d':'+25% XP','c':(100,255,100),'mx':5},
    {'id':'recovery','n':'Regeneração','d':'+0.5 Vida/s','c':(200,255,200),'mx':5},
    {'id':'revival','n':'Reviver','d':'+1 Vida Extra','c':(255,220,100),'mx':3},
    {'id':'curse','n':'Maldição','d':'+10% Vel/XP Inimigos','c':(200,50,200),'mx':5},
    {'id':'luck','n':'Sorte','d':'+15% Melhor Drops','c':(255,255,120),'mx':5},
    {'id':'duration','n':'Duração','d':'+15% Duração','c':(180,150,255),'mx':5},
]

# ═══ WEAPON INSTANCE ═══
class WeaponInst:
    def __init__(s,wd):
        s.wd=wd; s.level=1; s.timer=0.; s.orbit_angle=random.random()*math.tau
        s.hit_cd_t={}
    def name(s): return s.wd['n']
    def color(s): return s.wd['c']
    def wtype(s): return s.wd['t']
    def maxlv(s): return s.wd['ml']
    def stat(s,key,default=0):
        pair=s.wd.get(key,(default,0))
        return pair[0]+(s.level-1)*pair[1] if isinstance(pair,tuple) else pair
    def fire(s,pcx,pcy,face,enemies,pstats):
        t=s.wd['t']; dm_m=pstats.get('dmg_mult',1.0); dur_m=pstats.get('dur_mult',1.0)
        objs=[]
        if t=='melee':
            w2=int(s.stat('w')); h2=int(s.stat('h'))
            kb=s.wd.get('kb',(200,-90,20,-8))
            kbv=(kb[0]+(s.level-1)*kb[2] if len(kb)>2 else kb[0],
                 kb[1]+(s.level-1)*kb[3] if len(kb)>3 else kb[1])
            dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr')*dur_m
            if s.wd.get('dir'):
                nd=s.wd['dir']
                for d in range(nd):
                    a=d/nd*math.tau; vx=math.cos(a)*50; vy=math.sin(a)*50
                    objs.append(AtkObj(pcx-w2/2,pcy-h2/2,w2,h2,dmg,dur,s.color(),
                                       vel=[vx,vy],kb=kbv,piercing=True,hit_cd=0.05))
            else:
                x=pcx if face>0 else pcx-w2
                objs.append(AtkObj(x,pcy-h2/2,w2,h2,dmg,dur,s.color(),kb=kbv,piercing=True,hit_cd=0.05))
        elif t=='proj':
            ct=int(s.stat('ct')); sp=s.stat('sp'); dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr')*dur_m
            pr=s.wd.get('pr',False); grv=s.wd.get('grv',0); br=s.wd.get('br',False)
            kb=s.wd.get('kb',(100,-50)); spr=s.wd.get('spr',0)
            for i in range(ct):
                ba=0 if face>0 else math.pi
                if spr>0: ba+=(i-(ct-1)/2)*math.radians(spr/ct)
                objs.append(AtkObj(pcx,pcy,8,8,dmg,dur,s.color(),
                                   vel=[math.cos(ba)*sp,math.sin(ba)*sp],kb=kb,piercing=pr,grav=grv,boomerang=br))
        elif t=='homing':
            ct=int(s.stat('ct')); sp=s.stat('sp'); dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr')*dur_m
            hm=s.wd.get('hm',250); kb=s.wd.get('kb',(80,-40))
            for i in range(ct):
                a=i/ct*math.tau
                objs.append(AtkObj(pcx,pcy,8,8,dmg,dur,s.color(),
                                   vel=[math.cos(a)*sp*0.3,math.sin(a)*sp*0.3],kb=kb,homing=hm,piercing=True))
        elif t=='lightning':
            rng=s.stat('rng'); rad=s.stat('rad'); dmg=int(s.stat('dm')*dm_m)
            kb=s.wd.get('kb',(0,-200)); best=None; bd=rng
            for e in enemies:
                if not e.active: continue
                d2=dst((pcx,pcy),e.ctr)
                if d2<bd: bd=d2; best=e
            if best: objs.append(AtkObj(best.cx-rad,best.cy-rad,rad*2,rad*2,dmg,0.2,s.color(),kb=kb))
        elif t=='area':
            mxr=s.stat('mxr'); dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr',0.25)*dur_m
            kb=s.wd.get('kb',(0,-60)); sp=s.stat('sp')
            if sp>0:
                objs.append(AtkObj(pcx-10,pcy-10,20,20,dmg,dur,s.color(),kb=kb,piercing=True,expand=sp))
            else:
                r=int(mxr); objs.append(AtkObj(pcx-r,pcy-r,r*2,r*2,dmg,dur,s.color(),kb=kb,piercing=True))
        elif t=='rain':
            ct=int(s.stat('ct')); sp=s.stat('sp'); dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr')*dur_m
            kb=s.wd.get('kb',(30,-80))
            for i in range(ct):
                objs.append(AtkObj(pcx+random.uniform(-250,250),pcy-300,16,16,dmg,dur,
                                   s.color(),vel=[0,sp],kb=kb,piercing=True,grav=400))
        elif t=='summon':
            ct=int(s.stat('ct')); dur=s.stat('dur')*dur_m; dmg=int(s.stat('dm')*dm_m)
            sp=s.stat('sp'); sz=s.wd.get('sz',12)
            for i in range(ct):
                objs.append(AtkObj(pcx+random.uniform(-30,30),pcy-30,sz,sz,dmg,dur,
                                   s.color(),vel=[random.uniform(-sp,sp),random.uniform(-sp,0)],
                                   kb=(80,-50),homing=150,piercing=True,hit_cd=0.5))
        elif t=='beam':
            dur=s.stat('dr')*dur_m; frz=s.stat('frz')
            objs.append(AtkObj(pcx-3,pcy-400,6,800,0,dur,s.color(),freeze_dur=frz,piercing=True,
                               vel=[face*s.stat('sp'),0]))
        elif t=='shield':
            dur=s.stat('dur')*dur_m
            objs.append(AtkObj(pcx-30,pcy-30,60,60,0,dur,s.color(),piercing=True))
        elif t=='laser':
            dur=s.stat('dr')*dur_m; dmg=int(s.stat('dm')*dm_m)
            kb=s.wd.get('kb',(50,0))
            x=pcx if face>0 else pcx-SW
            objs.append(AtkObj(x,pcy-4,SW,12,dmg,dur,s.color(),kb=kb,piercing=True))
        elif t=='trail':
            dur=s.stat('dr')*dur_m; dmg=int(s.stat('dm')*dm_m)
            kb=s.wd.get('kb',(50,-30))
            objs.append(AtkObj(pcx-6,pcy+PH-12,12,12,dmg,dur,s.color(),kb=kb,piercing=True,hit_cd=0.2))
        return objs

# ═══ CHARACTERS ═══
CHARS=[
    {'id':'padrao','n':'Quadrado','desc':'O herói retangular original',
     'ach':None,'weapons':['whip'],'know_idx':-1,'know_lv':0,'col':P_COL,'acc':P_ACC},
    {'id':'lamina','n':'Retângulo Lâmina','desc':'Veloz e mortal com facas',
     'ach':'first_blood','weapons':['knife'],'know_idx':-1,'know_lv':0,'col':(200,200,210),'acc':C_KNIFE},
    {'id':'gelido','n':'Retângulo Gélido','desc':'Gela tudo que toca',
     'ach':'survivor','weapons':['ice'],'know_idx':-1,'know_lv':0,'col':(150,200,255),'acc':C_ICE},
    {'id':'arcano','n':'Retângulo Arcano','desc':'Mísseis mágicos + Poder',
     'ach':'slayer','weapons':['missile'],'know_idx':1,'know_lv':1,'col':(180,130,255),'acc':C_MISS},
    {'id':'sagrado','n':'Retângulo Sagrado','desc':'Bíblias sagradas orbitando',
     'ach':'boss_down','weapons':['holy_bible'],'know_idx':-1,'know_lv':0,'col':(255,230,180),'acc':C_BIBLE},
    {'id':'relampago','n':'Retângulo Relâmpago','desc':'Raios + Rapidez',
     'ach':'lv20','weapons':['thunder'],'know_idx':3,'know_lv':1,'col':(255,255,120),'acc':C_THUN},
    {'id':'fantasma','n':'Retângulo Fantasma','desc':'Morcegos + Velocidade',
     'ach':'no_hit','weapons':['summon_bat'],'know_idx':2,'know_lv':1,'col':(150,70,190),'acc':C_FLY},
    {'id':'sombrio','n':'Retângulo Sombrio','desc':'Pentagrama + Maldição',
     'ach':'minute30','weapons':['pentagram'],'know_idx':9,'know_lv':1,'col':(255,80,200),'acc':C_PENTA},
]

# ═══ SPAWNER ═══
class Spawner:
    def __init__(s): s.timer=2.; s.cd=2.5; s.mb_cd=150.; s.boss_cd=600.; s.mb_count=0; s.boss_count=0
    def update(s,dt,cx,cy,t):
        s.timer-=dt; s.cd=max(0.3,2.5-t/90); es=[]
        if s.timer<=0: s.timer=s.cd; es.extend(s._wave(cx,cy,t))
        s.mb_cd-=dt
        if s.mb_cd<=0:
            s.mb_cd=150.; s.mb_count+=1
            mt2=[MB_DRAGON,MB_BAT,MB_DKNIGHT,MB_LICH,MB_SBEAST,MB_CKNIGHT,MB_WORM,MB_GUARDIAN,MB_REAVER]
            mtype=mt2[(s.mb_count-1)%len(mt2)]
            mx=cx+random.choice([-1,1])*(SW/2+80); my=GROUND_ROW*TS-E_DATA[mtype]['h']
            es.append(Enemy(mx,my,mtype,t))
        s.boss_cd-=dt
        if s.boss_cd<=0:
            s.boss_cd=600.; s.boss_count+=1
            btype=[BOSS_DEMON,BOSS_VOID,BOSS_ENDLESS][min(s.boss_count-1,2)]
            es.append(Enemy(cx,GROUND_ROW*TS-E_DATA[btype]['h'],btype,t))
        return es
    def _wave(s,cx,cy,t):
        es=[]; n=min(30,2+int(t/8)); types=[E_CRAWL]
        if t>15: types.append(E_SWARM)
        if t>25: types.append(E_FLY)
        if t>40: types.append(E_LEAP)
        if t>55: types.append(E_ARCH)
        if t>70: types.append(E_SPLIT)
        if t>85: types.append(E_CHRG)
        if t>100: types.append(E_EXPLO)
        if t>120: types.append(E_BRUTE)
        if t>150: types.append(E_SHIELD)
        if t>180: types.append(E_NECRO)
        if t>210: types.append(E_BOMBER)
        if t>300: types.append(E_GHOST)
        if t>400: types.append(E_WRAITH)
        gy=GROUND_ROW*TS
        for _ in range(n):
            et=random.choice(types); side=random.choice([-1,1])
            x=cx+side*(SW/2+50+random.random()*200)
            y=cy+random.uniform(-SH/3,SH/3) if et in (E_FLY,E_SWARM,E_GHOST,E_NECRO) else gy-E_DATA[et]['h']
            es.append(Enemy(x,y,et,t))
        return es

# ═══ PLAYER ═══
class Player:
    def __init__(s,part):
        s.pos=[0.,0.]; s.vel=[0.,0.]; s.gnd=False; s.face=1
        s.hp=100; s.max_hp=100; s.xp=0; s.level=1; s.xp_next=10
        s.weapons=[]; s.know=[0]*12; s.inv=0.; s.kills=0
        s.alive=True; s.lives=1; s.part=part
        s.coyt=0.; s.jbuf=0.; s.sq_x=s.sq_y=1.0
        s.tr=[[0.,0.] for _ in range(6)]; s.tri=0; s.trt=0.
        s.regen_t=0.; s.moving_t=0.; s.shield_t=0.
        s.char_col=P_COL; s.char_acc=P_ACC
    @property
    def cx(s): return s.pos[0]+PW*0.5
    @property
    def cy(s): return s.pos[1]+PH*0.5
    @property
    def ctr(s): return (s.cx,s.cy)
    @property
    def box(s): return AABB(s.pos[0],s.pos[1],PW,PH)
    def spawn(s,x,y):
        s.pos=[float(x),float(y)]; s.vel=[0,0]; s.hp=s.max_hp; s.alive=True; s.inv=0
    def add_xp(s,amt):
        s.xp+=int(amt*(1.0+s.know[6]*0.25))
    def check_lvup(s):
        if s.xp>=s.xp_next:
            s.xp-=s.xp_next; s.level+=1
            s.xp_next=int(10+s.level*8+s.level**1.5)
            s.hp=min(s.hp+15,s.max_hp); return True
        return False
    def apply_upgrade(s,utype,idx):
        if utype=='wnew': s.weapons.append(WeaponInst(WD[idx]))
        elif utype=='wup': s.weapons[idx].level+=1
        elif utype=='know':
            s.know[idx]+=1
            if idx==0: old=s.max_hp; s.max_hp=100+s.know[0]*25; s.hp+=s.max_hp-old
        elif utype=='heal': s.hp=s.max_hp
    def dmg_mult(s): return 1.0+s.know[1]*0.15
    def spd_mult(s): return 1.0+s.know[2]*0.15
    def cd_mult(s): return max(0.3,1.0-s.know[3]*0.15)
    def armor(s): return s.know[4]
    def magnet(s): return MAG_BASE*(1.0+s.know[5]*0.4)
    def dur_mult(s): return 1.0+s.know[11]*0.15
    def take_dmg(s,d):
        if s.inv>0 or s.shield_t>0: return
        s.hp-=max(1,d-s.armor()); s.inv=0.5
        if s.hp<=0:
            s.hp=0
            if s.lives>0: s.lives-=1; s.hp=s.max_hp//2; s.inv=2.0
            else: s.alive=False
    def update(s,inp,solids,dt):
        if not s.alive: return
        s.inv-=dt; s.regen_t-=dt; s.shield_t-=dt
        if s.regen_t<=0:
            s.regen_t=1.0; reg=s.know[7]*0.5
            if reg>0: s.hp=min(s.max_hp,s.hp+int(reg))
        s.sq_x=lerp(s.sq_x,1.,12*dt); s.sq_y=lerp(s.sq_y,1.,12*dt)
        sm=s.spd_mult(); d=s._dir(inp)
        if d: s.face=d
        if s.gnd:
            if d: s.vel[0]=mt(s.vel[0],d*250*sm,2400*sm*dt)
            else: s.vel[0]=mt(s.vel[0],0,3000*dt)
        else:
            if d: s.vel[0]=mt(s.vel[0],d*230*sm,1800*sm*dt)
            else: s.vel[0]=mt(s.vel[0],0,600*dt)
        s.vel[1]+=GRAV*dt
        if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
        jp=s._jp(inp)
        if jp and (s.gnd or s.coyt>0):
            s.vel[1]=JVEL; s.gnd=False; s.coyt=0; s.jbuf=0; s.sq_x,s.sq_y=0.8,1.3
            s.part.dust([s.cx,s.pos[1]+PH],5,160,alp(s.char_acc,200))
        if not s.gnd: s.coyt-=dt
        if s.gnd: s.coyt=COYOTE_T
        if jp: s.jbuf=JBUF_T
        s.jbuf-=dt; was_gnd=s.gnd
        s.gnd=phys_move(s.pos,s.vel,PW,PH,solids,dt)
        if s.gnd and not was_gnd:
            s.sq_x,s.sq_y=1.2,0.8
            s.part.dust([s.cx,s.pos[1]+PH],4,120,alp(s.char_acc,200))
            if s.jbuf>0: s.vel[1]=JVEL; s.gnd=False
        if s.pos[1]>(GROUND_ROW+5)*TS: s.pos[1]=GROUND_ROW*TS-PH; s.vel[1]=0; s.gnd=True
        s.trt-=dt
        if s.trt<=0:
            s.trt=0.02; s.tr[s.tri]=[s.cx,s.cy]; s.tri=(s.tri+1)%len(s.tr)
        s.moving_t=0 if abs(s.vel[0])>10 else s.moving_t+dt
    @staticmethod
    def _dir(inp):
        l=inp.held(pygame.K_LEFT) or inp.held(pygame.K_a)
        r=inp.held(pygame.K_RIGHT) or inp.held(pygame.K_d)
        return (-1 if l and not r else 1 if r and not l else 0)
    @staticmethod
    def _jp(inp):
        return inp.just(pygame.K_SPACE) or inp.just(pygame.K_z) or inp.just(pygame.K_UP) or inp.just(pygame.K_w)
    def draw(s,surf,cam):
        if not s.alive: return
        if s.inv>0 and int(s.inv/0.08)%2==0: return
        ox,oy=cam.ox,cam.oy
        for i in range(len(s.tr)):
            idx=(s.tri+i)%len(s.tr); t=(i+1)/(len(s.tr)+1)
            if t<0.15: continue
            a=max(0,min(int(t*40),180)); sc=0.5+0.5*t; tw2,th2=PW*sc,PH*sc
            tc=s.tr[idx]; sf=pygame.Surface((int(tw2),int(th2)),pygame.SRCALPHA)
            sf.fill((*C_TRAIL[:3],a)); surf.blit(sf,(int(tc[0]-tw2*0.5-ox),int(tc[1]-th2*0.5-oy)))
        gs=pygame.Surface((PW+12,PH+12),pygame.SRCALPHA)
        gs.fill((*s.char_acc[:3],35)); surf.blit(gs,(int(s.pos[0]-6-ox),int(s.pos[1]-6-oy)))
        if s.shield_t>0:
            aura=pygame.Surface((PW+30,PH+30),pygame.SRCALPHA)
            pygame.draw.ellipse(aura,(*C_LAUREL[:3],min(80,int(s.shield_t*60))),(0,0,PW+30,PH+30))
            surf.blit(aura,(int(s.pos[0]-15-ox),int(s.pos[1]-15-oy)))
        br=1+math.sin(pygame.time.get_ticks()/300)*0.015
        bw=PW*s.sq_x*br; bh=PH*s.sq_y*(2-br)
        bx=s.pos[0]+(PW-bw)*0.5; by=s.pos[1]+(PH-bh)
        pygame.draw.rect(surf,s.char_col,(int(bx-ox),int(by-oy),int(bw),int(bh)))
        cw=8
        pygame.draw.rect(surf,s.char_acc,(int(s.pos[0]+(PW-cw)*0.5-ox),int(s.pos[1]+PH*0.4-oy),cw,5))
        tri_x=s.pos[0]+PW+2 if s.face>0 else s.pos[0]-6
        pygame.draw.rect(surf,alp(s.char_acc,150),(int(tri_x-ox),int(s.pos[1]+PH*0.25-oy),4,4))
# ═══ UPGRADE OPTIONS ═══
def get_options(pl):
    opts=[]
    for i,w in enumerate(pl.weapons):
        if w.level<w.maxlv():
            opts.append(('wup',i,f"{w.name()} → Nv{w.level+1}",w.wd['d'],w.color()))
    owned_ids=[w.wd['id'] for w in pl.weapons]
    for j,wd in enumerate(WD):
        if wd['id'] not in owned_ids and len(pl.weapons)<6:
            opts.append(('wnew',j,f"★ {wd['n']}",wd['d'],wd['c']))
    for j,k in enumerate(KNOW):
        if pl.know[j]<k['mx']:
            opts.append(('know',j,f"{k['n']} Nv{pl.know[j]+1}",k['d'],k['c']))
    if not opts: opts.append(('heal',0,"Cura Total","Restaura toda vida",HP_C))
    random.shuffle(opts); return opts[:3]

# ═══ ACHIEVEMENTS ═══
ACHS=[
    {'id':'first_blood','n':'Primeiro Sangue','d':'No meio do caos, a calmaria é impossível — ou deveria ser','hint':'Fique parado por 60 segundos numa partida.'},
    {'id':'survivor','n':'Sobrevivente','d':'Supere a primeira tempestade','hint':'Sobreviva por 5 minutos.'},
    {'id':'slayer','n':'Destruidor','d':'A horda cai','hint':'Mate 100 inimigos numa partida.'},
    {'id':'boss_down','n':'Caçador de Chefes','d':'Até os titãs caem','hint':'Derrote seu primeiro chefe.'},
    {'id':'max_weapon','n':'Totalmente Armado','d':'Desempenho máximo','hint':'Leve qualquer arma ao nível máximo.'},
    {'id':'collector','n':'Colecionador','d':'Variedade é o tempero da morte','hint':'Tenha 4 armas diferentes ao mesmo tempo.'},
    {'id':'lv20','n':'Ascendente','d':'Poder além da medida','hint':'Alcance o nível 20.'},
    {'id':'no_hit','n':'Intocável','d':'Eles não podem tocar a perfeição','hint':'Sobreviva 120 segundos sem receber dano.'},
    {'id':'hoarder','n':'Acumulador','d':'Brilhante','hint':'Colete 500 gemas numa partida.'},
    {'id':'speed_demon','n':'Demônio da Velocidade','d':'Rápido demais para ver','hint':'Alcance a velocidade máxima de movimento.'},
    {'id':'mini_boss','n':'Caçador de Gigantes','d':'Quanto maiores, mais alto caem','hint':'Derrote um mini-chefe.'},
    {'id':'minute30','n':'Resistência','d':'A maratona de sangue','hint':'Sobreviva por 30 minutos e vença.'},
]
def check_achs(pl,time_s,kills,gems_col,hit_t,sd):
    new=[]; aid=set(SAVE['achs'])
    if pl.moving_t>=60 and 'first_blood' not in aid: new.append('first_blood')
    if time_s>=300 and 'survivor' not in aid: new.append('survivor')
    if kills>=100 and 'slayer' not in aid: new.append('slayer')
    if sd.get('boss_killed') and 'boss_down' not in aid: new.append('boss_down')
    if any(w.level>=8 for w in pl.weapons) and 'max_weapon' not in aid: new.append('max_weapon')
    if len(pl.weapons)>=4 and 'collector' not in aid: new.append('collector')
    if pl.level>=20 and 'lv20' not in aid: new.append('lv20')
    if hit_t>=120 and 'no_hit' not in aid: new.append('no_hit')
    if gems_col>=500 and 'hoarder' not in aid: new.append('hoarder')
    if pl.spd_mult()>=1.75 and 'speed_demon' not in aid: new.append('speed_demon')
    if sd.get('mb_killed') and 'mini_boss' not in aid: new.append('mini_boss')
    if time_s>=1800 and 'minute30' not in aid: new.append('minute30')
    for a in new: SAVE['achs'].append(a)
    save_disk(); return new

# ═══ DRAW FUNCTIONS ═══
def draw_bg(surf,cx,t):
    o1=cx*0.05; s1=280.; st1=-(((o1%s1)+s1)%s1)-s1; x=st1
    while x<SW+s1:
        y=int(200+math.sin(t*0.15+x*0.003)*50); pygame.draw.circle(surf,(20,22,38),(int(x),y),100); x+=s1
    o2=cx*0.15; s2=200.; st2=-(((o2%s2)+s2)%s2)-s2; x=st2
    while x<SW+s2:
        y=int(380+math.cos(t*0.25+x*0.004)*30); pygame.draw.rect(surf,(25,28,44),(int(x),y,60,60)); x+=s2

def draw_attacks(surf,cam,attacks,pl):
    ox,oy=cam.ox,cam.oy
    for a in attacks:
        if not a.active: continue
        t=a.age/max(0.01,a.max_life); alpha=max(0,min(int((1-t)*220),255))
        x,y=int(a.pos[0]-ox),int(a.pos[1]-oy); w2,h2=int(a.w),int(a.h)
        if w2<1 or h2<1: continue
        sf=pygame.Surface((w2+4,h2+4),pygame.SRCALPHA)
        if a.freeze_dur>0:
            pygame.draw.line(sf,(*a.color,alpha),(w2//2,0),(w2//2,h2),max(2,w2))
        elif a.expand>0:
            pygame.draw.circle(sf,(*a.color,alpha),(w2//2,h2//2),max(2,w2//2),max(2,int(4-t*3)))
        else:
            pygame.draw.rect(sf,(*a.color,alpha),(0,0,w2,h2),border_radius=4)
        surf.blit(sf,(x-2,y-2))
    for w in pl.weapons:
        if w.wtype() in ('orbit_proj','orbit'):
            st_c=int(w.stat('ct')); st_r=w.stat('rad'); st_sz=int(w.stat('sz',8))
            for i in range(max(1,st_c)):
                ang=w.orbit_angle+i*(math.tau/st_c)
                opx=pl.cx+math.cos(ang)*st_r-ox; opy=pl.cy+math.sin(ang)*st_r-oy
                pygame.draw.circle(surf,w.color(),(int(opx),int(opy)),st_sz)
                pygame.draw.circle(surf,WHITE,(int(opx),int(opy)),max(1,st_sz-3))

def draw_hud(surf,pl,t,kills,achs_new):
    bw2=200; bx2,by2=20,16
    pygame.draw.rect(surf,(35,35,45),(bx2,by2,bw2,14),border_radius=3)
    r=max(0,pl.hp/max(1,pl.max_hp))
    pygame.draw.rect(surf,HP_C,(bx2,by2,int(bw2*r),14),border_radius=3)
    rtxt(surf,FONT_S,f"HP {pl.hp}/{pl.max_hp}",(bx2+4,by2+1),WHITE)
    xpy=by2+20; pygame.draw.rect(surf,(25,45,25),(bx2,xpy,bw2,8),border_radius=2)
    xr=max(0,pl.xp/max(1,pl.xp_next))
    pygame.draw.rect(surf,XP_C,(bx2,xpy,int(bw2*xr),8),border_radius=2)
    rtxt(surf,FONT_S,f"Nv {pl.level}",(bx2+bw2+10,by2+1),P_ACC)
    if pl.lives>0: rtxt(surf,FONT_S,f"Vidas: {pl.lives}",(bx2+bw2+60,by2+1),(255,220,100))
    m,s2=int(t/60),int(t%60)
    rtxt(surf,FONT_M,f"{m:02d}:{s2:02d}",(SW//2,16),WHITE,center=True)
    rtxt(surf,FONT_S,f"Abates: {kills}",(SW-100,16),UI_C)
    wy=SH-50
    for i,w in enumerate(pl.weapons):
        wx=20+i*42; pygame.draw.rect(surf,w.color(),(wx,wy,34,34),border_radius=5)
        rtxt(surf,FONT_S,str(w.level),(wx+12,wy+10),WHITE)
    for i,lv in enumerate(pl.know):
        if lv>0:
            px=SW-36-i*32; pygame.draw.rect(surf,KNOW[i]['c'],(px,wy,26,26),border_radius=3)
            rtxt(surf,FONT_S,str(lv),(px+8,wy+8),WHITE)
    if achs_new:
        for i,aid in enumerate(achs_new):
            a=next((x for x in ACHS if x['id']==aid),None)
            if a: rtxt(surf,FONT_M,f"★ {a['n']}",(SW//2,80+i*30),(255,220,100),center=True)

def draw_lvup(surf,opts,sel):
    ov=pygame.Surface((SW,SH),pygame.SRCALPHA); ov.fill((0,0,0,180)); surf.blit(ov,(0,0))
    rtxt(surf,FONT_L,"S U B I U   D E   N Í V E L !",(SW//2,140),P_ACC,center=True)
    for i,(_,_,name,desc,col) in enumerate(opts):
        y=220+i*130; sel2=(i==sel); bw3,bh2=500,100; bx3=SW//2-bw3//2
        bg2=(40,45,65) if not sel2 else (55,60,85); brd=P_ACC if sel2 else (60,65,85)
        pygame.draw.rect(surf,bg2,(bx3,y,bw3,bh2),border_radius=6)
        pygame.draw.rect(surf,brd,(bx3,y,bw3,bh2),2,border_radius=6)
        pygame.draw.rect(surf,col,(bx3+12,y+12,8,bh2-24),border_radius=2)
        rtxt(surf,FONT_M,name,(bx3+32,y+20),WHITE if sel2 else UI_C)
        rtxt(surf,FONT_S,desc,(bx3+32,y+55),UI_DIM)
        if sel2: rtxt(surf,FONT_M,"▶",(bx3-30,y+30),P_ACC)
    rtxt(surf,FONT_S,"↑↓ Selecionar    Z/ESPACO Confirmar",(SW//2,SH-50),UI_DIM,center=True)

def draw_title(surf,sel):
    surf.fill(BG)
    rtxt(surf,FONT_XL,"S Q U A R E   R E B E L L I O N",(SW//2,180),P_ACC,center=True)
    rtxt(surf,FONT_S,"(Sim, o personagem é um retângulo)",(SW//2,230),UI_DIM,center=True)
    opts2=["Jogar","Índice de Inimigos","Livro de Armas","Conquistas"]
    for i,o in enumerate(opts2):
        c=P_ACC if i==sel else UI_C
        rtxt(surf,FONT_M,f"{'▶ ' if i==sel else '  '}{o}",(SW//2,320+i*50),c,center=True)
    rtxt(surf,FONT_S,f"Recorde: {SAVE['best']}s    Partidas: {SAVE['runs']}",(SW//2,SH-40),UI_DIM,center=True)
    rtxt(surf,FONT_S,"↑↓ Selecionar    Z/ESPACO Confirmar    ESC Sair",(SW//2,SH-20),UI_DIM,center=True)

def draw_char_select(surf,sel):
    surf.fill(BG)
    rtxt(surf,FONT_L,"E S C O L H A   S E U   R E T Â N G U L O",(SW//2,40),P_ACC,center=True)
    for i,ch in enumerate(CHARS):
        y=100+i*72; sel2=(i==sel); unlocked=ch['ach'] is None or ch['ach'] in SAVE['achs']
        bg2=(40,45,65) if sel2 else (25,28,40); brd2=P_ACC if sel2 else (35,38,55)
        pygame.draw.rect(surf,bg2,(200,y,880,60),border_radius=5)
        pygame.draw.rect(surf,brd2,(200,y,880,60),1,border_radius=5)
        # Preview
        col2=ch['col'] if unlocked else (50,50,60); acc2=ch['acc'] if unlocked else (60,60,70)
        pygame.draw.rect(surf,col2,(215,y+12,20,36))
        pygame.draw.rect(surf,acc2,(220,y+28,10,6))
        if unlocked:
            rtxt(surf,FONT_M,ch['n'],(250,y+8),WHITE if sel2 else UI_C)
            wname=next((w['n'] for w in WD if w['id']==ch['weapons'][0]),'?')
            extra=f"  |  Conhecimento: {KNOW[ch['know_idx']]['n']}" if ch['know_idx']>=0 else ""
            rtxt(surf,FONT_S,f"Arma: {wname}{extra}",(250,y+35),UI_DIM)
            rtxt(surf,FONT_S,ch['desc'],(650,y+25),UI_C if sel2 else UI_DIM)
        else:
            rtxt(surf,FONT_M,"???",(250,y+8),UI_DIM)
            ach_hint=next((a['hint'] for a in ACHS if a['id']==ch['ach']),"???")
            rtxt(surf,FONT_S,f"Desbloqueie: {ach_hint}",(250,y+35),UI_DIM)
        if sel2: rtxt(surf,FONT_M,"▶",(175,y+15),P_ACC)
    rtxt(surf,FONT_S,"↑↓ Selecionar    Z/ESPACO Confirmar    ESC Voltar",(SW//2,SH-20),UI_DIM,center=True)

def draw_enemy_index(surf,page):
    surf.fill(BG)
    rtxt(surf,FONT_L,"Í N D I C E   D E   I N I M I G O S",(SW//2,30),P_ACC,center=True)
    per_page=7; start=page*per_page; ids=sorted(ENEMY_NAMES.keys()); total=len(ids)
    for i in range(per_page):
        idx=start+i
        if idx>=total: break
        eid=ids[idx]; nm=ENEMY_NAMES[eid]; y=80+i*80; kd=SAVE['kills'].get(str(eid),0); ed=E_DATA[eid]
        pygame.draw.rect(surf,ed['c'],(60,y+10,ed['w'],ed['h']),border_radius=3)
        is_mb=" [MINI-CHEFE]" if eid in MB_TYPES else ""; is_b=" [CHEFE]" if eid in BOSS_TYPES else ""
        rtxt(surf,FONT_M,f"{nm}{is_mb}{is_b}",(100,y+5),WHITE)
        rtxt(surf,FONT_S,f"HP:{ed['hp']} DMG:{ed['dmg']} VEL:{ed['spd']}",(100,y+30),UI_DIM)
        rtxt(surf,FONT_S,f"Derrotados: {kd}",(100,y+48),XP_C)
    pages=(total+per_page-1)//per_page
    rtxt(surf,FONT_S,f"Página {page+1}/{pages}    ←→ Mudar    ESC Voltar",(SW//2,SH-30),UI_DIM,center=True)

def draw_weapon_book(surf,page):
    surf.fill(BG)
    rtxt(surf,FONT_L,"L I V R O   D E   A R M A S",(SW//2,30),P_ACC,center=True)
    per_page=6; start=page*per_page
    for i in range(per_page):
        idx=start+i
        if idx>=len(WD): break
        wd=WD[idx]; y=80+i*100
        pygame.draw.rect(surf,wd['c'],(50,y,10,70),border_radius=2)
        rtxt(surf,FONT_M,wd['n'],(75,y+5),WHITE)
        rtxt(surf,FONT_S,f"Tipo: {wd['t']}  |  Nível Máx: {wd['ml']}",(75,y+30),UI_DIM)
        rtxt(surf,FONT_S,wd['d'],(75,y+48),UI_C)
    pages=(len(WD)+per_page-1)//per_page
    rtxt(surf,FONT_S,f"Página {page+1}/{pages}    ←→ Mudar    ESC Voltar",(SW//2,SH-130),UI_DIM,center=True)
    ky=SH-110; rtxt(surf,FONT_M,"Conhecimento (Passivas)",(SW//2,ky),P_ACC,center=True)
    for j,k in enumerate(KNOW):
        x=50+j*100
        if x>SW-80: break
        pygame.draw.rect(surf,k['c'],(x,ky+30,20,20),border_radius=3)
        rtxt(surf,FONT_S,k['n'][:6],(x,ky+55),UI_DIM)

def draw_achievements(surf):
    surf.fill(BG)
    rtxt(surf,FONT_L,"C O N Q U I S T A S",(SW//2,30),P_ACC,center=True)
    for i,a in enumerate(ACHS):
        y=70+i*50; unlocked=a['id'] in SAVE['achs']
        col3=(255,220,100) if unlocked else UI_DIM; icon="★" if unlocked else "?"
        rtxt(surf,FONT_M,f"{icon}  {a['n']}",(60,y),col3)
        hint=a['d'] if unlocked else a['hint']
        rtxt(surf,FONT_S,hint,(100,y+24),UI_C if unlocked else UI_DIM)
    rtxt(surf,FONT_S,"ESC Voltar",(SW//2,SH-30),UI_DIM,center=True)

def draw_gameover(surf,t,kills,lv):
    ov=pygame.Surface((SW,SH),pygame.SRCALPHA); ov.fill((0,0,0,200)); surf.blit(ov,(0,0))
    rtxt(surf,FONT_XL,"F I M   D E   J O G O",(SW//2,SH//2-80),DMG_F,center=True)
    m,s2=int(t/60),int(t%60)
    rtxt(surf,FONT_M,f"Sobreviveu: {m:02d}:{s2:02d}  |  Nível: {lv}  |  Abates: {kills}",
         (SW//2,SH//2),UI_C,center=True)
    rtxt(surf,FONT_S,"R para jogar novamente    ESC para menu",(SW//2,SH//2+50),UI_DIM,center=True)

def draw_victory(surf,t,kills,lv):
    ov=pygame.Surface((SW,SH),pygame.SRCALPHA); ov.fill((0,0,0,200)); surf.blit(ov,(0,0))
    rtxt(surf,FONT_XL,"V I T Ó R I A !",(SW//2,SH//2-80),P_ACC,center=True)
    m,s2=int(t/60),int(t%60)
    rtxt(surf,FONT_M,f"Tempo: {m:02d}:{s2:02d}  |  Nível: {lv}  |  Abates: {kills}",
         (SW//2,SH//2),UI_C,center=True)
    rtxt(surf,FONT_S,"R para jogar novamente    ESC para menu",(SW//2,SH//2+50),UI_DIM,center=True)

# ═══ MAIN ═══
(ST_TITLE,ST_CHARSEL,ST_PLAY,ST_LVUP,ST_OVER,ST_VICTORY,
 ST_INDEX,ST_BOOK,ST_ACHS)=range(9)

def main():
    inp=Input(); part=Particles(); cam=Camera()
    pl=Player(part); world=World(); spawner=Spawner()
    sx=5*TS; sy=GROUND_ROW*TS-PH-10
    enemies=[]; attacks=[]; gems=[]
    time_s=0.; kills=0; gems_col=0; hit_timer=0.
    state=ST_TITLE; title_sel=0; char_sel=0
    lv_opts=[]; lv_sel=0; index_page=0; book_page=0
    achs_new=[]; achs_timer=0.; boss_killed=False; mb_killed=False
    running=True

    while running:
        dt=min(CLOCK.tick(60)/1000.,0.05)
        inp.update()
        if inp.quit_req: break

        # ESC handling — go back, never quit mid-game
        if inp.just(pygame.K_ESCAPE):
            if state==ST_TITLE: break  # quit from title
            elif state in (ST_INDEX,ST_BOOK,ST_ACHS,ST_CHARSEL): state=ST_TITLE
            elif state in (ST_PLAY,ST_LVUP): state=ST_TITLE
            elif state in (ST_OVER,ST_VICTORY): state=ST_TITLE

        # ── TITLE ──
        if state==ST_TITLE:
            if inp.just(pygame.K_UP) or inp.just(pygame.K_w): title_sel=(title_sel-1)%4
            if inp.just(pygame.K_DOWN) or inp.just(pygame.K_s): title_sel=(title_sel+1)%4
            if inp.just(pygame.K_z) or inp.just(pygame.K_SPACE) or inp.just(pygame.K_RETURN):
                if title_sel==0: char_sel=0; state=ST_CHARSEL
                elif title_sel==1: index_page=0; state=ST_INDEX
                elif title_sel==2: book_page=0; state=ST_BOOK
                elif title_sel==3: state=ST_ACHS

        # ── CHARACTER SELECT ──
        elif state==ST_CHARSEL:
            if inp.just(pygame.K_UP) or inp.just(pygame.K_w): char_sel=(char_sel-1)%len(CHARS)
            if inp.just(pygame.K_DOWN) or inp.just(pygame.K_s): char_sel=(char_sel+1)%len(CHARS)
            if inp.just(pygame.K_z) or inp.just(pygame.K_SPACE) or inp.just(pygame.K_RETURN):
                ch=CHARS[char_sel]
                unlocked=ch['ach'] is None or ch['ach'] in SAVE['achs']
                if unlocked:
                    part=Particles(); cam=Camera(); pl=Player(part); world=World(); spawner=Spawner()
                    pl.spawn(sx,sy); cam.x=sx-SW/2; cam.y=sy-SH/2
                    pl.char_col=ch['col']; pl.char_acc=ch['acc']
                    for wid in ch['weapons']:
                        wd_entry=next((w for w in WD if w['id']==wid),WD[0])
                        pl.weapons.append(WeaponInst(wd_entry))
                    if ch['know_idx']>=0:
                        pl.know[ch['know_idx']]=ch['know_lv']
                        if ch['know_idx']==0: pl.max_hp=100+pl.know[0]*25; pl.hp=pl.max_hp
                    enemies=[]; attacks=[]; gems=[]
                    time_s=0.; kills=0; gems_col=0; hit_timer=0.
                    boss_killed=False; mb_killed=False; achs_new=[]
                    state=ST_PLAY; SAVE['runs']+=1; save_disk()

        # ── INDEX/BOOK/ACHS ──
        elif state==ST_INDEX:
            if inp.just(pygame.K_LEFT): index_page=max(0,index_page-1)
            if inp.just(pygame.K_RIGHT):
                max_p=(len(ENEMY_NAMES)+6)//7; index_page=min(max_p-1,index_page+1)
        elif state==ST_BOOK:
            if inp.just(pygame.K_LEFT): book_page=max(0,book_page-1)
            if inp.just(pygame.K_RIGHT):
                max_p=(len(WD)+5)//6; book_page=min(max_p-1,book_page+1)

        # ── PLAY ──
        elif state==ST_PLAY:
            time_s+=dt; hit_timer+=dt; pl.update(inp,world.solids,dt); achs_timer-=dt
            if not pl.alive:
                SAVE['best']=max(SAVE['best'],int(time_s)); save_disk(); state=ST_OVER; continue
            if time_s>=MAX_TIME:
                SAVE['best']=max(SAVE['best'],int(time_s)); save_disk(); state=ST_VICTORY; continue
            world.update(pl.pos[0])

            # Auto-weapons
            pstats={'cd_mult':pl.cd_mult(),'dmg_mult':pl.dmg_mult(),'dur_mult':pl.dur_mult()}
            for w in pl.weapons:
                if w.wtype() in ('orbit_proj','orbit'): continue
                if w.wtype()=='shield':
                    w.timer-=dt*pl.cd_mult()
                    if w.timer<=0:
                        w.timer=max(0.5,w.stat('cd')); pl.shield_t=w.stat('dur')*pl.dur_mult()
                    continue
                if w.wtype()=='trail' and abs(pl.vel[0])<50: continue
                w.timer-=dt*pl.cd_mult()
                if w.timer<=0:
                    w.timer=max(0.1,w.stat('cd'))
                    na=w.fire(pl.cx,pl.cy,pl.face,enemies,pstats)
                    attacks.extend(na)
                    if na: cam.shake(2,0.05)

            # Orbit weapons collision
            for w in pl.weapons:
                if w.wtype() in ('orbit_proj','orbit'):
                    st_c=int(w.stat('ct')); st_r=w.stat('rad'); st_sp=w.stat('spd')
                    st_sz=int(w.stat('sz',8)); st_dm=int(w.stat('dm')*pl.dmg_mult())
                    w.orbit_angle+=st_sp*dt
                    for i in range(max(1,st_c)):
                        ang=w.orbit_angle+i*(math.tau/st_c)
                        opx=pl.cx+math.cos(ang)*st_r; opy=pl.cy+math.sin(ang)*st_r
                        ob=AABB(opx-st_sz,opy-st_sz,st_sz*2,st_sz*2)
                        for e in enemies:
                            if not e.active: continue
                            eid=id(e)
                            if ob.ov(e.box) and (eid not in w.hit_cd_t or time_s-w.hit_cd_t[eid]>0.25):
                                w.hit_cd_t[eid]=time_s
                                e.take_hit(st_dm,(sign(e.cx-pl.cx)*100,-60))
                                part.burst(e.ctr,3,80,0.2,2,alp(w.color(),200))

            # Attacks
            for a in attacks:
                a.update(dt,enemies if a.homing else None)
                if not a.active: continue
                if a.freeze_dur>0:
                    for e in enemies:
                        if e.active and a.box.ov(e.box): e.frozen=a.freeze_dur
                for e in enemies:
                    if not e.active or id(e) in a.hit: continue
                    if a.box.ov(e.box):
                        kb=(sign(e.cx-pl.cx)*abs(a.kb[0]),a.kb[1])
                        e.take_hit(a.dmg,kb); a.hit.add(id(e))
                        part.burst(e.ctr,5,100,0.2,3,alp(a.color,200)); cam.shake(2,0.05)
                        if not a.piercing: a.active=False; break
            attacks=[a for a in attacks if a.active]

            # Enemies
            for e in enemies: e.update(pl.ctr,world.solids,dt,enemies)
            # Enemy projectiles hit player
            if pl.inv<=0 and pl.shield_t<=0:
                for e in enemies:
                    for p in e.proj:
                        if abs(p[0]-pl.cx)<PW and abs(p[1]-pl.cy)<PH:
                            pl.take_dmg(e.dmg); cam.shake(6,0.12)
                            part.burst(pl.ctr,10,150,0.3,3,alp(DMG_F,200))
                            pl.vel[0]=sign(pl.cx-e.cx)*200; pl.vel[1]=-150; hit_timer=0; p[4]=0
            # Contact damage
            if pl.inv<=0 and pl.shield_t<=0:
                for e in enemies:
                    if not e.active: continue
                    if pl.box.ov(e.box):
                        pl.take_dmg(e.dmg); cam.shake(6,0.12)
                        part.burst(pl.ctr,10,150,0.3,3,alp(DMG_F,200))
                        pl.vel[0]=sign(pl.cx-e.cx)*200; pl.vel[1]=-150; hit_timer=0; break

            # Enemy death
            alive=[]
            for e in enemies:
                if e.active: alive.append(e)
                else:
                    kills+=1; pl.kills=kills
                    eid_str=str(e.et); SAVE['kills'][eid_str]=SAVE['kills'].get(eid_str,0)+1
                    if e.is_boss: boss_killed=True
                    if e.is_mb: mb_killed=True
                    rem=e.xp
                    while rem>0:
                        if rem>=10: gems.append(Gem(e.cx+random.uniform(-5,5),e.cy,10)); rem-=10
                        elif rem>=3: gems.append(Gem(e.cx+random.uniform(-5,5),e.cy,3)); rem-=3
                        else: gems.append(Gem(e.cx+random.uniform(-5,5),e.cy,1)); rem-=1
                    part.burst(e.ctr,15,200,0.4,4,alp(e.col,255))
            enemies=alive

            # Gems
            mag=pl.magnet()
            for g in gems:
                g.update(pl.ctr,mag,dt)
                if g.active and dst(g.pos,pl.ctr)<20:
                    g.active=False; pl.add_xp(g.value); gems_col+=1
                    part.burst(g.pos,4,60,0.15,2,alp(g.color,200))
            gems=[g for g in gems if g.active]

            # Level up
            if pl.check_lvup(): state=ST_LVUP; lv_opts=get_options(pl); lv_sel=0

            # Spawn
            ne=spawner.update(dt,cam.x+SW/2,cam.y+SH/2,time_s); enemies.extend(ne)

            # Achievements
            if achs_timer<=0:
                achs_timer=2.; sd={'boss_killed':boss_killed,'mb_killed':mb_killed}
                new=check_achs(pl,time_s,kills,gems_col,hit_timer,sd)
                if new: achs_new=new; achs_timer=5.

            cam.update(pl.ctr,dt); part.update(dt)

        # ── LEVEL UP ──
        elif state==ST_LVUP:
            if inp.just(pygame.K_UP) or inp.just(pygame.K_w): lv_sel=(lv_sel-1)%len(lv_opts)
            if inp.just(pygame.K_DOWN) or inp.just(pygame.K_s): lv_sel=(lv_sel+1)%len(lv_opts)
            if inp.just(pygame.K_z) or inp.just(pygame.K_SPACE) or inp.just(pygame.K_RETURN):
                utype,idx,_,_,_=lv_opts[lv_sel]; pl.apply_upgrade(utype,idx); state=ST_PLAY
                if pl.check_lvup(): lv_opts=get_options(pl); lv_sel=0; state=ST_LVUP

        # ── OVER / VICTORY ──
        elif state in (ST_OVER,ST_VICTORY):
            part.update(dt)
            if inp.just(pygame.K_r): state=ST_CHARSEL

        # ── RENDER ──
        SCREEN.fill(BG)
        if state==ST_TITLE: draw_title(SCREEN,title_sel)
        elif state==ST_CHARSEL: draw_char_select(SCREEN,char_sel)
        elif state==ST_INDEX: draw_enemy_index(SCREEN,index_page)
        elif state==ST_BOOK: draw_weapon_book(SCREEN,book_page)
        elif state==ST_ACHS: draw_achievements(SCREEN)
        elif state in (ST_PLAY,ST_LVUP):
            draw_bg(SCREEN,cam.x,time_s); world.draw(SCREEN,cam)
            for g in gems: g.draw(SCREEN,cam)
            for e in enemies: e.draw(SCREEN,cam)
            pl.draw(SCREEN,cam); draw_attacks(SCREEN,cam,attacks,pl)
            part.draw(SCREEN,cam)
            draw_hud(SCREEN,pl,time_s,kills,achs_new if achs_timer>0 else [])
            for e in enemies:
                if e.is_boss and e.active:
                    rtxt(SCREEN,FONT_M,"⚠ CHEFE ⚠",(SW//2,50),(255,80,80),center=True); break
            if time_s<8:
                rtxt(SCREEN,FONT_S,"← → Mover   ↑/ESPACO Pular   Armas disparam automaticamente!",
                     (SW//2,SH-80),UI_DIM,center=True)
            if state==ST_LVUP: draw_lvup(SCREEN,lv_opts,lv_sel)
        elif state==ST_OVER:
            draw_bg(SCREEN,cam.x,time_s); world.draw(SCREEN,cam)
            part.draw(SCREEN,cam); draw_gameover(SCREEN,time_s,kills,pl.level)
        elif state==ST_VICTORY:
            draw_bg(SCREEN,cam.x,time_s); world.draw(SCREEN,cam)
            part.draw(SCREEN,cam); draw_victory(SCREEN,time_s,kills,pl.level)

        pygame.display.flip()

    save_disk(); pygame.quit(); sys.exit()

if __name__=="__main__": main()