#!/usr/bin/env python3
"""
Square Rebellion — 2D Vampire Survivors Platformer
30 weapons · evolutions · 12+ knowledge · unique enemies · bosses with AI
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
PW, PH = 20, 34; COYOTE_T = 0.1; JBUF_T = 0.1; MAG_BASE = 50.0
MAX_TIME = 1800; MAX_WEAPONS = 6; MAX_KNOW = 6

# ═══ COLORS ═══
BG=(12,10,22); GRND_C=(28,32,48); GRND_E=(48,52,72); PLAT_C=(35,40,58); PLAT_E=(55,60,82)
P_COL=(230,235,245); P_ACC=(78,205,196); P_GLOW=(78,205,196,35); C_TRAIL=(180,185,200)
WHITE=(255,255,255); BLACK=(0,0,0); UI_C=(200,200,210); UI_DIM=(130,130,140)
HP_C=(78,205,196); XP_C=(100,220,100); DMG_F=(200,40,40); EVO_C=(255,200,50)
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
C_GHOST_E=(140,160,200); C_WRAITH=(60,60,80)

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

# ═══ INPUT ═══
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

ENEMY_DESC={
    0:'Deixa rastro venenoso',1:'Mergulha do alto',2:'Onda de choque ao pousar',
    3:'Golpes pesados empurram',4:'Atira flechas e recua',
    5:'Divide ao morrer',6:'Divide em 2 ao morrer',7:'Carga devastadora',
    8:'Explode ao morrer',9:'Bloqueia ataques frontais',
    10:'Revive mortos',11:'Lança bombas explosivas',12:'Atravessa plataformas',
    13:'Teleporta atrás de você',14:'Bafo de fogo em cone',
    15:'Bando de morcegos',16:'Golpe de espada em arco',
    17:'Congela área ao redor',18:'Investida invisível',19:'Maldição reduz dano',
    20:'Surge do chão',21:'Escudo rotativo',22:'Drena vida',
    23:'Chuva de fogo + invoca',24:'Teleporte + projéteis',25:'Todas as habilidades'}

E_DATA={
    0:{'w':26,'h':26,'hp':10,'spd':80,'dmg':1,'xp':2,'c':C_CRAWL,'c2':(255,120,120)},
    1:{'w':22,'h':22,'hp':10,'spd':95,'dmg':1,'xp':3,'c':C_FLY,'c2':(210,150,255)},
    2:{'w':26,'h':26,'hp':20,'spd':55,'dmg':2,'xp':5,'c':C_LEAP,'c2':(120,190,255)},
    3:{'w':34,'h':34,'hp':50,'spd':38,'dmg':4,'xp':12,'c':C_BRUTE,'c2':(220,90,70)},
    4:{'w':24,'h':24,'hp':12,'spd':50,'dmg':2,'xp':4,'c':C_ARCH_E,'c2':(140,230,140)},
    5:{'w':16,'h':16,'hp':5,'spd':130,'dmg':1,'xp':1,'c':C_SWARM_E,'c2':(255,255,120)},
    6:{'w':26,'h':26,'hp':25,'spd':60,'dmg':2,'xp':5,'c':C_SPLIT,'c2':(220,160,240)},
    7:{'w':28,'h':28,'hp':30,'spd':45,'dmg':4,'xp':7,'c':C_CHRG,'c2':(255,200,100)},
    8:{'w':24,'h':24,'hp':18,'spd':65,'dmg':2,'xp':4,'c':C_EXPLO,'c2':(255,120,160)},
    9:{'w':28,'h':28,'hp':35,'spd':45,'dmg':2,'xp':7,'c':C_SHIELD_E,'c2':(120,160,240)},
    10:{'w':26,'h':26,'hp':20,'spd':40,'dmg':1,'xp':10,'c':C_NECRO,'c2':(160,120,220)},
    11:{'w':26,'h':26,'hp':18,'spd':50,'dmg':2,'xp':5,'c':C_BOMBER,'c2':(230,200,130)},
    12:{'w':24,'h':24,'hp':15,'spd':80,'dmg':2,'xp':5,'c':C_GHOST_E,'c2':(190,210,240)},
    13:{'w':28,'h':28,'hp':25,'spd':100,'dmg':3,'xp':8,'c':C_WRAITH,'c2':(120,120,150)},
    14:{'w':60,'h':50,'hp':200,'spd':60,'dmg':5,'xp':80,'c':(180,80,60),'c2':(240,140,100)},
    15:{'w':50,'h':40,'hp':150,'spd':100,'dmg':3,'xp':60,'c':(120,60,160),'c2':(180,120,220)},
    16:{'w':40,'h':55,'hp':250,'spd':50,'dmg':6,'xp':100,'c':(60,60,120),'c2':(100,100,180)},
    17:{'w':36,'h':50,'hp':200,'spd':40,'dmg':4,'xp':110,'c':(80,120,80),'c2':(140,180,140)},
    18:{'w':45,'h':45,'hp':220,'spd':90,'dmg':5,'xp':90,'c':(40,40,60),'c2':(80,80,100)},
    19:{'w':42,'h':55,'hp':280,'spd':45,'dmg':5,'xp':120,'c':(100,60,60),'c2':(160,120,120)},
    20:{'w':70,'h':35,'hp':300,'spd':55,'dmg':7,'xp':140,'c':(100,80,60),'c2':(160,140,100)},
    21:{'w':44,'h':52,'hp':260,'spd':65,'dmg':6,'xp':130,'c':(60,100,140),'c2':(100,160,200)},
    22:{'w':40,'h':48,'hp':250,'spd':80,'dmg':7,'xp':150,'c':(80,40,80),'c2':(140,80,140)},
    23:{'w':60,'h':70,'hp':800,'spd':50,'dmg':6,'xp':400,'c':(180,30,30),'c2':(255,80,80)},
    24:{'w':70,'h':80,'hp':2000,'spd':55,'dmg':8,'xp':800,'c':(60,20,80),'c2':(120,60,160)},
    25:{'w':80,'h':90,'hp':5000,'spd':60,'dmg':12,'xp':0,'c':(20,20,30),'c2':(60,60,80)},
}

# ═══ ENEMY CLASS ═══
class Enemy:
    def __init__(s,x,y,etype,t=0):
        d=E_DATA[etype]; s.pos=[float(x),float(y)]; s.vel=[0.,0.]
        s.w,s.h=d['w'],d['h']; sc=1.0+(t/120.)**1.3
        s.hp=s.mhp=max(1,int(d['hp']*sc)); s.spd=d['spd']
        s.dmg=d['dmg']+(0 if t<30 else int((t-30)/60))
        s.xp=d['xp']
        s.col,s.col2=d['c'],d['c2']; s.et=etype
        s.active=True; s.gnd=False; s.hf=0.; s.at=random.random()*10
        s.sq_x=s.sq_y=1.0; s.pdir=sign(random.uniform(-1,1))
        s.hop_t=1.+random.random()*1.5; s.state=0; s.state_t=0.
        s.proj=[]; s.is_boss=etype in BOSS_TYPES; s.is_mb=etype in MB_TYPES
        s.phase=0; s.atk_cd=2.; s.summon_cd=5.; s.special_cd=8.
        s.shield_hp=50 if etype==E_SHIELD else 0; s.frozen=0.
        s.just_landed=False; s._prev_gnd=False
        s.kb_resist=0.6 if etype not in (E_SWARM,E_GHOST) else 0.2
        s.alive_t=0.
        s.base_spd=d['spd']
        s.flash_t=0.
        s.invisible=0.; s.curse_aura=0.
        # Boss-specific
        s.offscreen_t=0.; s.flee_t=0.; s.enraged=False; s.enrage_t=0.
    
    @property
    def cx(s): return s.pos[0]+s.w*0.5
    @property
    def cy(s): return s.pos[1]+s.h*0.5
    @property
    def ctr(s): return (s.cx,s.cy)
    @property
    def box(s): return AABB(s.pos[0],s.pos[1],s.w,s.h)
    def take_hit(s,dmg,kb=(0,0)):
        if s.shield_hp>0:
            s.shield_hp-=dmg
            if s.shield_hp<=0: s.shield_hp=0
            return
        s.hp-=dmg; s.hf=0.12; s.flash_t=0.1
        s.vel[0]+=kb[0]*s.kb_resist; s.vel[1]+=kb[1]*s.kb_resist
        if s.hp<=0: s.active=False

    def update(s,pctr,solids,dt,enemies=None,game_time=0):
        if not s.active: return
        s.hf-=dt;s.flash_t-=dt; s.at+=dt; s.state_t+=dt; s.frozen-=dt
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
        spd_m=s.spd*(2.0 if s.enraged else 1.0)
        s.alive_t+=dt
        rage_mult=1.0+s.alive_t/15.  # +100% speed every 15 seconds alive
        spd_m*=min(rage_mult,4.0)
        if dist<150 and et not in (E_SWARM,E_GHOST,E_NECRO):
            spd_m*=1.4
        # ── BOSS AI: teleport + enrage ──
        if s.is_boss:
            scr_x=pctr[0]-SW/2<=s.pos[0]<=pctr[0]+SW/2
            scr_y=pctr[1]-SH/2<=s.pos[1]<=pctr[1]+SH/2
            if not (scr_x and scr_y):
                s.offscreen_t+=dt
            else:
                s.offscreen_t=0
            if s.offscreen_t>10.:
                side=random.choice([-1,1])
                s.pos[0]=pctr[0]+side*(SW/2-80)
                s.pos[1]=pctr[1]-50
                s.offscreen_t=0; s.vel=[0,0]
            if dist>300:
                s.flee_t+=dt
            else:
                s.flee_t=max(0,s.flee_t-dt*0.5)
            if s.flee_t>60. and not s.enraged:
                s.enraged=True; s.enrage_t=0
            if s.enraged:
                s.enrage_t+=dt

        # ── Enemy behavior ──
        if et==E_CRAWL:
            spd_actual=spd_m*1.3
            s.vel[0]=sign(dx)*spd_actual
            s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            if s.gnd and dist>TS*3 and dy<-TS*0.5:
                s.vel[1]=JVEL*0.6; s.gnd=False
        elif et==E_FLY:
            if s.state==0:
                d2=max(1,dist)
                s.pos[0]+=(dx/d2)*spd_m*1.5*dt
                s.pos[1]+=(dy/d2)*spd_m*dt
                if dist<250 and s.state_t>1.: s.state=1; s.state_t=0
            else:
                s.pos[0]+=sign(dx)*spd_m*4*dt
                s.pos[1]+=spd_m*5*dt
                if s.state_t>0.4: s.state=0; s.state_t=0

        elif et==E_LEAP:
            s.vel[0]=sign(dx)*spd_m; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.hop_t-=dt
            if s.gnd and s.hop_t<=0:
                s.vel[1]=JVEL*0.9; s.vel[0]=sign(dx)*spd_m*2.5; s.gnd=False
                s.hop_t=0.8+random.random()*1.2; s.sq_x,s.sq_y=0.7,1.4
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            if s.gnd and s.hop_t<=0:
                s.vel[1]=JVEL*0.9; s.vel[0]=sign(dx)*spd_m*2.5; s.gnd=False
                s.hop_t=0.8+random.random()*1.2; s.sq_x,s.sq_y=0.7,1.4
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            if s.just_landed:
                for ang in [-0.5,0,0.5]:
                    s.proj.append([s.cx,s.cy,math.cos(ang)*sign(dx)*200,math.sin(ang)*200-100,0.5,False])

        elif et==E_BRUTE:
            s.vel[0]=sign(dx)*spd_m*0.7; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)

        elif et==E_ARCH:
            if dist>250: s.vel[0]=sign(dx)*spd_m; s.vel[1]+=GRAV*dt
            else:
                s.vel[0]*=0.9; s.vel[1]+=GRAV*dt; s.pos[0]-=sign(dx)*spd_m*0.3*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            if dist<400 and s.state_t>1.5:
                s.state_t=0; spd2=350; sdx,sdy=dx/dist,dy/dist
                s.proj.append([s.cx,s.cy,sdx*spd2,sdy*spd2,4.])

        elif et==E_SPLIT:
            s.vel[0]=sign(dx)*spd_m*1.2; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            if s.gnd and dy<-TS*0.5:
                s.vel[1]=JVEL*0.75; s.gnd=False

        elif et==E_SWARM:
            d2=max(1,dist); s.pos[0]+=(dx/d2)*spd_m*dt; s.pos[1]+=(dy/d2)*spd_m*dt
            s.pos[0]+=math.sin(s.at*8)*1.5; s.pos[1]+=math.cos(s.at*6)*1.0
            # bounds so they don't fly off forever
            gy=GROUND_ROW*TS
            if s.pos[1]>gy: s.pos[1]=gy-10

        elif et==E_CHRG:
            if s.state==0:
                s.vel[0]=sign(dx)*spd_m*0.5; s.vel[1]+=GRAV*dt
                if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
                s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
                if dist<250 and s.state_t>1.: s.state=1; s.state_t=0; s.pdir=sign(dx)
            else:
                s.vel[0]=s.pdir*spd_m*5; s.vel[1]+=GRAV*dt
                if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
                s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
                if s.state_t>0.6: s.state=0; s.state_t=0

        elif et==E_EXPLO:
            s.vel[0]=sign(dx)*spd_m; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)

        elif et==E_SHIELD:
            s.vel[0]=sign(dx)*spd_m*0.8; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            s.pdir=sign(dx)  # always faces player

        elif et==E_NECRO:
            d2=max(1,dist); s.pos[0]+=(dx/d2)*spd_m*dt; s.pos[1]+=(dy/d2)*spd_m*dt
            if s.state_t>4. and enemies:
                s.state_t=0
                for e2 in enemies:
                    if not e2.active and not e2.is_boss and not e2.is_mb:
                        if dst(s.ctr,e2.ctr)<250: e2.active=True; e2.hp=e2.mhp//2; break

        elif et==E_BOMBER:
            if dist>200: s.vel[0]=sign(dx)*spd_m; s.vel[1]+=GRAV*dt
            else: s.vel[0]*=0.9; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            if s.state_t>2.:
                s.state_t=0; s.proj.append([s.cx,s.cy,dx/dist*180,-400.,2.5,True])

        elif et==E_GHOST:
            # phases through platforms, semi-transparent
            d2=max(1,dist); s.pos[0]+=(dx/d2)*spd_m*dt; s.pos[1]+=(dy/d2)*spd_m*dt
            s.pos[1]+=math.sin(s.at*2)*1.0

        elif et==E_WRAITH:
            s.vel[0]=sign(dx)*spd_m; s.vel[1]+=GRAV*dt
            if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
            s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
            s.special_cd-=dt
            if s.special_cd<=0:
                s.special_cd=2.5+random.random()*1.5
                a=random.random()*math.tau; r=80+random.random()*80
                s.pos[0]=pctr[0]+math.cos(a)*r; s.pos[1]=pctr[1]+math.sin(a)*r

        elif et in MB_TYPES or et in BOSS_TYPES:
            s._boss_ai(dx,dy,dist,spd_m,solids,pctr,dt,enemies)

        s.just_landed = hasattr(s, '_prev_gnd') and s.gnd and not s._prev_gnd
        s._prev_gnd = s.gnd

    def _boss_ai(s,dx,dy,dist,spd_m,solids,pctr,dt,enemies):
        s.atk_cd-=dt; s.summon_cd-=dt; s.special_cd-=dt
        hp_r=s.hp/s.mhp
        if hp_r<0.5 and s.phase==0: s.phase=1
        if hp_r<0.25 and s.phase==1 and s.et==BOSS_ENDLESS: s.phase=2
        s.vel[0]=sign(dx)*spd_m; s.vel[1]+=GRAV*dt
        if s.vel[1]>MAX_FALL: s.vel[1]=MAX_FALL
        s.gnd=phys_move(s.pos,s.vel,s.w,s.h,solids,dt)
        if s.atk_cd<=0:
            s.atk_cd=max(0.8,2.5-s.phase*0.5)
            n=(5 if s.et==BOSS_DEMON else 4 if s.et==BOSS_VOID else 8)+s.phase*3
            for i in range(n):
                a=i/n*math.tau+s.at*0.3; sp=220+s.phase*60
                s.proj.append([s.cx,s.cy,math.cos(a)*sp,math.sin(a)*sp,4.])
        if s.summon_cd<=0:
            s.summon_cd=max(2.,6.-s.phase*2)
            if enemies is not None:
                types=[E_CRAWL,E_FLY,E_LEAP,E_BRUTE]
                for _ in range(3+s.phase*2):
                    enemies.append(Enemy(s.cx+random.uniform(-120,120),
                                         s.cy+random.uniform(-50,50),random.choice(types)))
        if s.special_cd<=0:
            s.special_cd=max(3.,8.-s.phase*2)
            if s.et==BOSS_DEMON:
                for a2 in range(8):
                    ang=a2/8*math.tau
                    s.proj.append([s.cx,s.cy,math.cos(ang)*350,math.sin(ang)*350,3.])
            elif s.et==BOSS_VOID:
                s.pos[0]=pctr[0]+random.choice([-1,1])*120; s.pos[1]=pctr[1]-60
                s.vel=[0,0]
            elif s.et==BOSS_ENDLESS:
                for a2 in range(16):
                    ang=a2/16*math.tau
                    s.proj.append([s.cx,s.cy,math.cos(ang)*280,math.sin(ang)*280,3.])
                if enemies is not None and s.phase>=2:
                    for _ in range(4):
                        enemies.append(Enemy(s.cx+random.uniform(-80,80),
                                             s.cy,random.choice([E_FLY,E_GHOST,E_WRAITH])))

    def draw(s,surf,cam):
        if not s.active: return
        ox,oy=cam.ox,cam.oy; x,y=s.pos[0]-ox,s.pos[1]-oy
        dw,dh=s.w*s.sq_x,s.h*s.sq_y; dx2=x+(s.w-dw)*0.5; dy2=y+(s.h-dh)
        # White flash on hit
        if s.flash_t>0:
            c=WHITE
        elif s.hf>0:
            c=s.col2
        elif s.enraged if hasattr(s,'enraged') else False:
            c=(min(255,s.col[0]+80),max(0,s.col[1]-40),max(0,s.col[2]-40))
        else:
            c=s.col
        rage=min(s.alive_t/30.,1.0) if hasattr(s,'alive_t') else 0
        if rage>0.2 and s.flash_t<=0 and s.hf<=0:
            c=(min(255,int(c[0]+rage*80)),max(0,int(c[1]-rage*40)),max(0,int(c[2]-rage*40)))
        if s.frozen>0: c=(min(255,c[0]+60),min(255,c[1]+60),min(255,c[2]+100))
        alpha=120 if s.et==E_GHOST else 255
        body_sf=pygame.Surface((int(dw)+4,int(dh)+4),pygame.SRCALPHA)
        cx_l,cy_l=int(dw//2)+2,int(dh//2)+2
        # Shape per enemy type
        if s.et in (E_FLY,E_EXPLO,E_NECRO,E_GHOST):
            # Circle
            r=max(3,int(min(dw,dh)//2))
            pygame.draw.circle(body_sf,(*c[:3],alpha),(cx_l,cy_l),r)
            if s.et==E_NECRO:
                pygame.draw.circle(body_sf,(*C_PENTA[:3],60),(cx_l,cy_l),r+5,2)
            if s.et==E_GHOST:
                for i in range(3):
                    wy=int(dh*0.2)+i*int(dh*0.25)
                    pygame.draw.line(body_sf,(200,200,240,50),(cx_l-r,cy_l-r+wy),(cx_l+r,cy_l-r+wy))
        elif s.et in (E_LEAP,E_CHRG):
            # Triangle
            pts=[(cx_l,2),(int(dw)+2,int(dh)+2),(2,int(dh)+2)]
            pygame.draw.polygon(body_sf,(*c[:3],alpha),pts)
            if s.et==E_CHRG and s.state==1:
                pygame.draw.line(body_sf,WHITE,(2,int(dh//2)+2),(int(dw)+2,int(dh//2)+2),2)
        elif s.et in (E_ARCH,E_SWARM):
            # Diamond
            pts=[(cx_l,2),(int(dw)+2,cy_l),(cx_l,int(dh)+2),(2,cy_l)]
            pygame.draw.polygon(body_sf,(*c[:3],alpha),pts)
        elif s.et==E_WRAITH:
            # Inverted triangle (menacing)
            pts=[(2,2),(int(dw)+2,2),(cx_l,int(dh)+2)]
            pygame.draw.polygon(body_sf,(*c[:3],alpha),pts)
            pygame.draw.polygon(body_sf,(200,200,255,40),pts,1)
        elif s.et==E_SPLIT:
            # Hexagon
            pts=[]
            for i in range(6):
                a=i/6*math.tau-math.pi/2
                pts.append((cx_l+int(math.cos(a)*cx_l*0.8),cy_l+int(math.sin(a)*cy_l*0.8)))
            pygame.draw.polygon(body_sf,(*c[:3],alpha),pts)
        else:
            # Square (crawler, brute, shield, bomber, bosses)
            pygame.draw.rect(body_sf,(*c[:3],alpha),(2,2,int(dw),int(dh)),border_radius=4)
            if s.et==E_BRUTE or s.is_boss:
                sc2=tuple(min(255,c[i]+30) for i in range(3))
                for i in range(3):
                    ly=int(dh*0.2)+i*int(dh*0.2)
                    pygame.draw.rect(body_sf,(*sc2[:3],alpha),(5,ly,int(dw)-4,2))
        # Shield visual
        if s.et==E_SHIELD and s.shield_hp>0:
            shx=int(dw)+4 if s.pdir>0 else -8
            pygame.draw.rect(body_sf,(100,150,255,200),(shx,4,8,int(dh)-8),border_radius=2)
        surf.blit(body_sf,(int(dx2)-2,int(dy2)-2))
        # Boss aura — bigger, more prominent
        if s.is_boss or s.is_mb:
            aura_sz=40 if s.is_boss else 20
            aura=pygame.Surface((int(dw)+aura_sz,int(dh)+aura_sz),pygame.SRCALPHA)
            aura_c=(255,50,50) if (hasattr(s,'enraged') and s.enraged) else s.col
            aura_a=70 if s.is_boss else 45
            pygame.draw.ellipse(aura,alp(aura_c,aura_a),(0,0,int(dw)+aura_sz,int(dh)+aura_sz))
            surf.blit(aura,(int(dx2)-aura_sz//2,int(dy2)-aura_sz//2))
            if hasattr(s,'enraged') and s.enraged:
                rtxt(surf,FONT_S,"IRADO!",(int(dx2),int(dy2)-18),(255,80,80))
        # Eyes — no eyes for swarm
        if s.et!=E_SWARM:
            ey=int(dy2+dh*0.3); ed=4 if (s.is_boss or s.is_mb) else 3
            ecx=int(dx2+dw*0.3); erx=int(dx2+dw*0.7)
            eye_c=(255,100,100) if (hasattr(s,'enraged') and s.enraged) else WHITE
            if s.flash_t>0: eye_c=(255,255,255)
            pygame.draw.circle(surf,eye_c,(ecx,ey),ed); pygame.draw.circle(surf,eye_c,(erx,ey),ed)
            pd=sign(s.vel[0]) if abs(s.vel[0])>10 else 0
            pc=(30,30,30) if s.flash_t<=0 else (200,200,200)
            pygame.draw.circle(surf,pc,(ecx+pd,ey),max(1,ed-1))
            pygame.draw.circle(surf,pc,(erx+pd,ey),max(1,ed-1))
        # HP BAR — bosses get large bar at top
        if s.is_boss or s.is_mb:
            if s.hp<s.mhp and s.hp>0:
                bw2=120 if s.is_boss else 80; bh2=8 if s.is_boss else 5
                bx3=int(dx2+(dw-bw2)/2); by3=int(dy2-16)
                pygame.draw.rect(surf,(30,30,40),(bx3-1,by3-1,bw2+2,bh2+2),border_radius=3)
                pygame.draw.rect(surf,(60,20,20),(bx3,by3,bw2,bh2),border_radius=2)
                hp_w=max(1,int(bw2*s.hp/s.mhp))
                hp_col=(255,50,50) if s.is_boss else (200,80,200)
                pygame.draw.rect(surf,hp_col,(bx3,by3,hp_w,bh2),border_radius=2)
                # Name
                nm=ENEMY_NAMES.get(s.et,'???')
                rtxt(surf,FONT_S,nm,(bx3+bw2//2,by3-12),WHITE,center=True)
        elif s.hp<s.mhp and s.hp>0:
            bw2=s.w+8; bx3=s.pos[0]-ox-(bw2-s.w)*0.5; by3=dy2-8
            pygame.draw.rect(surf,(50,50,60),(int(bx3),int(by3),int(bw2),3))
            pygame.draw.rect(surf,s.col,(int(bx3),int(by3),max(1,int(bw2*s.hp/s.mhp)),3))
        # Projectiles
        for p in s.proj:
            px2,py2=int(p[0]-ox),int(p[1]-oy)
            if s.et==E_CRAWL:
                # Poison puddle — translucent green blob
                ps=pygame.Surface((18,18),pygame.SRCALPHA)
                pygame.draw.circle(ps,(80,200,60,60),(9,9),9)
                pygame.draw.circle(ps,(100,255,80,40),(9,9),5)
                surf.blit(ps,(px2-9,py2-9))
            elif s.et==E_ARCH:
                pygame.draw.circle(surf,(200,255,200),(px2,py2),4)
                pygame.draw.circle(surf,WHITE,(px2,py2),2)
            else:
                col_p=(255,60,60) if s.is_boss else (200,200,100)
                sz=6 if s.is_boss else 4
                pygame.draw.circle(surf,col_p,(px2,py2),sz)
                pygame.draw.circle(surf,WHITE,(px2,py2),max(1,sz-2))
                
# ═══ ATTACK OBJECT ═══
class AtkObj:
    def __init__(s,x,y,w,h,dmg,life,color,vel=None,kb=(0,0),
                 piercing=False,expand=0,grav=0,hit_cd=0,homing=0,
                 boomerang=False,freeze_dur=0,lifesteal=0):
        s.pos=[x,y]; s.vel=list(vel or [0,0]); s.w=w; s.h=h
        s.dmg=dmg; s.life=life; s.max_life=life; s.color=color
        s.kb=kb; s.piercing=piercing; s.hit=set(); s.active=True; s.age=0.
        s.expand=expand; s.grav=grav; s.hit_cd=hit_cd; s.homing=homing
        s.boomerang=boomerang; s.origin=[x,y]; s.freeze_dur=freeze_dur
        s.hit_times={}; s.lifesteal=lifesteal
    @property
    def box(s): return AABB(s.pos[0],s.pos[1],s.w,s.h)
    def update(s,dt,enemies=None):
        s.pos[0]+=s.vel[0]*dt; s.pos[1]+=s.vel[1]*dt; s.vel[1]+=s.grav*dt
        if s.homing and enemies:
            best=None; bd=500
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

# ═══ WEAPON DEFINITIONS (30) + EVOLUTIONS ═══
WD=[
    {'id':'whip','n':'Chicote Vazio','d':'Varredura horizontal','c':C_WHIP,'t':'melee','ml':5,
     'cd':(1.2,-.06),'dm':(10,8),'w':(55,10),'h':(32,3),'kb':(220,-90,20,-8),'dr':(.2,0),
     'evo':{'id':'bloody_tear','n':'Lágrima Sangrenta','d':'Rouba vida ao acertar','c':(255,80,80),
            'dm':35,'w':90,'h':50,'kb':(300,-120),'dr':.25,'cd':0.6,'ls':0.15}},
    {'id':'phier','n':'Phieraggi','d':'Cortes multidirecionais','c':C_PHIER,'t':'melee','ml':5,
     'cd':(.5,-.03),'dm':(8,6),'w':(40,8),'h':(40,8),'kb':(180,-80,15,-6),'dr':(.18,0),'dir':4,
     'evo':{'id':'phier_supreme','n':'Phieraggi Supremo','d':'8 direções + explosão','c':(255,150,150),
            'dm':20,'w':60,'h':60,'kb':(250,-100),'dr':.2,'cd':0.3,'dir':8}},
    {'id':'vsword','n':'Espada Vitória','d':'Poderoso corte combo','c':C_VSWORD,'t':'melee','ml':5,
     'cd':(.6,-.04),'dm':(15,12),'w':(50,10),'h':(35,5),'kb':(250,-100,25,-10),'dr':(.22,0),
     'evo':{'id':'victory_blade','n':'Lâmina da Vitória','d':'Ignora armadura + crítico','c':(255,255,220),
            'dm':50,'w':70,'h':50,'kb':(400,-150),'dr':.3,'cd':0.5}},
    {'id':'ice','n':'Lâmina de Gelo','d':'Projétil perfurante de gelo','c':C_ICE,'t':'proj','ml':5,
     'cd':(.8,-.06),'dm':(8,6),'ct':(1,.3),'sp':(350,25),'dr':(.8,.06),'pr':True,'kb':(100,-50),
     'evo':{'id':'crystal_dust','n':'Pó de Cristal','d':'Congela + área ao acertar','c':(200,240,255),
            'dm':20,'ct':3,'sp':400,'dr':1.2,'cd':0.5,'pr':True,'kb':(120,-60),'freeze':2.0}},
    {'id':'knife','n':'Conjunto de Facas','d':'Facas rápidas para frente','c':C_KNIFE,'t':'proj','ml':5,
     'cd':(.4,-.03),'dm':(6,5),'ct':(1,.5),'sp':(400,35),'dr':(.6,.04),'spr':5,
     'evo':{'id':'thousand_edge','n':'Mil Lâminas','d':'Enxurrada de facas','c':(240,240,255),
            'dm':12,'ct':8,'sp':600,'dr':.5,'cd':0.15,'spr':12,'kb':(120,-40)}},
    {'id':'axe','n':'Arremesso de Machado','d':'Machados em arco','c':C_AXE,'t':'proj','ml':5,
     'cd':(1.0,-.07),'dm':(15,12),'ct':(1,.4),'sp':(250,20),'dr':(1.0,.06),'grv':-400,
     'evo':{'id':'death_spiral','n':'Espiral da Morte','d':'Machados orbitam e voltam','c':(255,200,140),
            'dm':30,'ct':4,'sp':350,'dr':1.5,'cd':0.6,'grv':-500,'pr':True,'kb':(200,-100)}},
    {'id':'bone','n':'Arremesso de Osso','d':'Ossos perfurantes','c':C_BONE,'t':'proj','ml':5,
     'cd':(.7,-.05),'dm':(10,8),'ct':(1,.4),'sp':(300,25),'dr':(.8,.06),'pr':True,
     'evo':{'id':'bone_storm','n':'Tempestade de Ossos','d':'Ossos em todas direções','c':(240,220,190),
            'dm':18,'ct':6,'sp':400,'dr':1.0,'cd':0.4,'pr':True,'kb':(150,-70)}},
    {'id':'arrow','n':'Seta Relâmpago','d':'Seta muito rápida','c':C_ARROW,'t':'proj','ml':5,
     'cd':(.5,-.04),'dm':(12,10),'ct':(1,.4),'sp':(600,50),'dr':(.5,.04),'kb':(150,-50),
     'evo':{'id':'storm_arrow','n':'Seta da Tempestade','d':'Perfura todos inimigos','c':(255,255,230),
            'dm':25,'ct':2,'sp':900,'dr':.4,'cd':0.3,'pr':True,'kb':(200,-80)}},
    {'id':'rune','n':'Runa Traçante','d':'Runa ricocheteante','c':C_RUNE,'t':'proj','ml':5,
     'cd':(.9,-.06),'dm':(10,8),'ct':(1,.4),'sp':(280,20),'dr':(1.5,.1),'pr':True,'bn':True,
     'evo':{'id':'rune_maze','n':'Labirinto Rúnico','d':'Ricocheteia infinitamente','c':(180,255,220),
            'dm':15,'ct':3,'sp':350,'dr':3.0,'cd':0.5,'pr':True,'bn':True,'kb':(120,-50)}},
    {'id':'tedge','n':'Mil Lâminas','d':'Múltiplos projéteis rápidos','c':C_KNIFE,'t':'proj','ml':5,
     'cd':(.3,-.02),'dm':(5,4),'ct':(3,.5),'sp':(500,40),'dr':(.4,.03),'spr':8},
    {'id':'missile','n':'Míssil Mágico','d':'Projéteis teleguiados','c':C_MISS,'t':'homing','ml':5,
     'cd':(1.2,-.08),'dm':(8,6),'ct':(2,.5),'sp':(300,25),'dr':(1.0,.06),'kb':(80,-40),'hm':300,
     'evo':{'id':'mega_missile','n':'Mega Míssil','d':'Rastreia implacavelmente','c':(220,170,255),
            'dm':18,'ct':5,'sp':400,'dr':1.5,'cd':0.7,'hm':500,'kb':(120,-60)}},
    {'id':'cross','n':'Cruz','d':'Cruz bumerangue','c':C_CROSS,'t':'proj','ml':5,
     'cd':(1.0,-.07),'dm':(12,10),'ct':(1,.4),'sp':(350,25),'dr':(1.2,.1),'pr':True,'br':True,
     'evo':{'id':'heaven_cross','n':'Cruz Celestial','d':'Bumerangue gigante perfurante','c':(255,255,200),
            'dm':28,'ct':2,'sp':450,'dr':1.8,'cd':0.6,'pr':True,'br':True,'kb':(180,-90)}},
    {'id':'fire_ring','n':'Anel de Fogo','d':'Anel em expansão','c':C_FIRE,'t':'area','ml':5,
     'cd':(3.0,-.25),'dm':(8,6),'sp':(220,35),'mxr':(90,18),'kb':(0,-60),
     'evo':{'id':'hellfire','n':'Fogo do Inferno','d':'Anel massivo + queima','c':(255,180,60),
            'dm':18,'sp':350,'mxr':180,'cd':1.5,'kb':(0,-120),'dr':1.0,'pr':True}},
    {'id':'holy_bible','n':'Bíblia Sagrada','d':'Bíblias projéteis orbitantes','c':C_BIBLE,'t':'proj','ml':5,
     'cd':(3.5,-.3),'dm':(10,8),'ct':(2,.5),'sp':(200,15),'dr':(2.0,.2),'pr':True,'kb':(100,-50),
     'evo':{'id':'unholy_vespers','n':'Vésperas Profanas','d':'Bíblias em dobro perfurantes','c':(255,240,200),
            'dm':18,'ct':6,'sp':350,'dr':3.0,'cd':1.5,'pr':True,'kb':(140,-70)}},
    {'id':'pentagram','n':'Pentagrama','d':'Explosão de área','c':C_PENTA,'t':'area','ml':5,
     'cd':(6.0,-.5),'dm':(30,25),'sp':(0,0),'mxr':(200,30),'kb':(0,-200),
     'evo':{'id':'hell_gram','n':'Pentagrama Infernal','d':'Destruição total','c':(255,100,220),
            'dm':80,'mxr':350,'cd':3.0,'kb':(0,-300)}},
    {'id':'santa_water','n':'Água Santa','d':'Gotas caem do céu','c':C_WATER,'t':'rain','ml':5,
     'cd':(1.5,-.12),'dm':(8,6),'ct':(3,.6),'sp':(300,25),'dr':(1.0,.1),'kb':(30,-80),
     'evo':{'id':'la_borra','n':'La Borra','d':'Água que explode ao cair','c':(100,150,255),
            'dm':18,'ct':8,'sp':400,'dr':1.5,'cd':0.8,'kb':(60,-120)}},
    {'id':'laurel','n':'Louro','d':'Barreira protetora','c':C_LAUREL,'t':'shield','ml':5,
     'cd':(5.0,-.4),'dm':(0,0),'dur':(2.0,.3),'sp':(0,0),
     'evo':{'id':'crimson_shroud','n':'Mortalha Carmesim','d':'Reflete dano + imunidade','c':(255,120,120),
            'dm':15,'dur':4.0,'cd':2.0,'reflect':True}},
    {'id':'soul_orbit','n':'Órbita de Almas','d':'Projéteis orbitantes','c':C_ORB,'t':'orbit_proj','ml':5,
     'cd':(0,0),'dm':(5,4),'ct':(2,.4),'rad':(55,10),'spd':(2.5,.4),'sz':(8,1)},
    {'id':'clock_lancet','n':'Lanceta','d':'Raio congelante','c':C_ICE,'t':'beam','ml':5,
     'cd':(3.0,-.25),'dm':(0,0),'dr':(1.5,.12),'frz':(2.0,.3),'sp':(500,40)},
    {'id':'summon_bat','n':'Enxame de Morcegos','d':'Invoca morcegos','c':C_FLY,'t':'summon','ml':5,
     'cd':(4.0,-.4),'dm':(6,5),'ct':(2,.6),'dur':(5.0,.5),'sp':(200,20),'sz':10},
    {'id':'summon_skel','n':'Exército Esqueleto','d':'Invoca esqueletos','c':C_BONE,'t':'summon','ml':5,
     'cd':(6.0,-.5),'dm':(10,8),'ct':(1,.4),'dur':(6.0,.6),'sp':(80,10),'sz':16},
    {'id':'summon_gear','n':'Engrenagem Guardiã','d':'Aliado escudo','c':C_SHIELD_W,'t':'summon','ml':5,
     'cd':(8.0,-.6),'dm':(8,6),'ct':(1,.3),'dur':(8.0,.6),'sp':(60,6),'sz':14},
    {'id':'thunder','n':'Raio','d':'Relâmpago no mais próximo','c':C_THUN,'t':'lightning','ml':5,
     'cd':(2.5,-.2),'dm':(25,18),'rng':(250,35),'rad':(35,8),'kb':(0,-200),
     'evo':{'id':'thunderstorm','n':'Tempestade','d':'Raios em cadeia','c':(255,255,180),
            'dm':40,'rng':400,'rad':60,'cd':1.0,'chain':3,'kb':(0,-250)}},
    {'id':'poison','n':'Nuvem Venenosa','d':'Névoa tóxica','c':C_POIS,'t':'area','ml':5,
     'cd':(3.0,-.25),'dm':(4,3),'sp':(0,0),'mxr':(80,12),'dr':(3.0,.4),'kb':(0,0)},
    {'id':'moonlight','n':'Luar','d':'Amplo corte em arco','c':C_MOON,'t':'melee','ml':5,
     'cd':(1.5,-.1),'dm':(18,15),'w':(80,12),'h':(60,10),'kb':(180,-120,15,-10),'dr':(.25,0)},
    {'id':'corridor','n':'Corredor Infinito','d':'Laser para frente','c':C_CORR,'t':'laser','ml':5,
     'cd':(4.0,-.35),'dm':(20,18),'dr':(1.0,.1),'sp':(0,0),'kb':(50,0)},
    {'id':'vandal','n':'Espada Vândala','d':'Golpe massivo no chão','c':C_VAND,'t':'melee','ml':5,
     'cd':(2.5,-.2),'dm':(30,25),'w':(100,18),'h':(50,10),'kb':(300,-150,30,-15),'dr':(.3,0)},
    {'id':'shroud','n':'Mortalha Sangrenta','d':'Pulso de sangue','c':C_SHROUD,'t':'area','ml':5,
     'cd':(2.0,-.15),'dm':(12,10),'sp':(0,0),'mxr':(120,18),'kb':(60,-40)},
    {'id':'pinion','n':'Pena Sombria','d':'Rastro ao se mover','c':C_PINION,'t':'trail','ml':5,
     'cd':(.15,-.008),'dm':(5,4),'dr':(1.5,.12),'sp':(0,0),'kb':(50,-30)},
]

# ═══ KNOWLEDGE (18 types) ═══
KNOW=[
    {'id':'vitality','n':'Vitalidade','d':'+25 Vida Máx','nx':'+25 Vida Máx','c':HP_C,'mx':5},
    {'id':'might','n':'Poder','d':'+15% Dano','nx':'+15% Dano','c':(220,80,80),'mx':5},
    {'id':'speed','n':'Velocidade','d':'+15% Velocidade','nx':'+15% Velocidade','c':(80,220,80),'mx':5},
    {'id':'haste','n':'Rapidez','d':'-15% Recargas','nx':'-15% Recargas','c':(80,180,220),'mx':5},
    {'id':'armor','n':'Armadura','d':'+1 Armadura','nx':'+1 Armadura','c':(180,180,180),'mx':5},
    {'id':'magnet','n':'Ímã','d':'+40% Alcance','nx':'+40% Alcance','c':(200,160,255),'mx':5},
    {'id':'growth','n':'Crescimento','d':'+25% XP','nx':'+25% XP','c':(100,255,100),'mx':5},
    {'id':'recovery','n':'Regeneração','d':'+0.5 Vida/s','nx':'+0.5 Vida/s','c':(200,255,200),'mx':5},
    {'id':'revival','n':'Reviver','d':'+1 Vida Extra','nx':'+1 Vida Extra','c':(255,220,100),'mx':3},
    {'id':'curse','n':'Maldição','d':'+10% Vel/XP Inimigos','nx':'+10% Vel/XP Inimigos','c':(200,50,200),'mx':5},
    {'id':'luck','n':'Sorte','d':'+15% Melhor Drops','nx':'+15% Melhor Drops','c':(255,255,120),'mx':5},
    {'id':'duration','n':'Duração','d':'+15% Duração','nx':'+15% Duração','c':(180,150,255),'mx':5},
    {'id':'multishot','n':'Multiprojétil','d':'+1 Projétil','nx':'+1 Projétil','c':(255,200,150),'mx':3},
    {'id':'proj_spd','n':'Vel. Projétil','d':'+20% Vel. Projétil','nx':'+20% Vel. Projétil','c':(200,255,200),'mx':5},
    {'id':'area_sz','n':'Tamanho Área','d':'+15% Tamanho de Área','nx':'+15% Tamanho de Área','c':(200,200,255),'mx':5},
    {'id':'crit','n':'Crítico','d':'+10% Chance Crítico','nx':'+10% Chance Crítico','c':(255,220,180),'mx':5},
    {'id':'lifesteal','n':'Roubo de Vida','d':'+3% Roubo de Vida','nx':'+3% Roubo de Vida','c':(255,100,100),'mx':5},
    {'id':'xp_magnet','n':'Ímã de XP','d':'+50% Alcance de XP','nx':'+50% Alcance de XP','c':(150,200,255),'mx':3},
]

# ═══ WEAPON INSTANCE ═══
class WeaponInst:
    def __init__(s,wd,from_evo=False):
        s.wd=wd; s.level=1; s.timer=0.; s.orbit_angle=random.random()*math.tau
        s.hit_cd_t={}; s.evolved=from_evo
    def name(s): return s.wd['n']
    def color(s): return s.wd['c']
    def wtype(s): return s.wd['t']
    def maxlv(s): return 5 if not s.evolved else 8
    def stat(s,key,default=0):
        pair=s.wd.get(key,(default,0))
        return pair[0]+(s.level-1)*pair[1] if isinstance(pair,tuple) else pair
    def can_evo(s): return s.level>=5 and not s.evolved and 'evo' in s.wd
    def fire(s,pcx,pcy,face,enemies,pstats):
        t=s.wd['t']; dm_m=pstats.get('dmg_mult',1.0); dur_m=pstats.get('dur_mult',1.0)
        ls=pstats.get('lifesteal',0)
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
                    a=d/nd*math.tau; vx=math.cos(a)*60; vy=math.sin(a)*60
                    objs.append(AtkObj(pcx-w2/2,pcy-h2/2,w2,h2,dmg,dur,s.color(),
                                       vel=[vx,vy],kb=kbv,piercing=True,hit_cd=0.05,lifesteal=ls))
            else:
                x=pcx if face>0 else pcx-w2
                objs.append(AtkObj(x,pcy-h2/2,w2,h2,dmg,dur,s.color(),kb=kbv,piercing=True,hit_cd=0.05,lifesteal=ls))
        elif t=='proj':
            ct=int(s.stat('ct'))+pstats.get('multishot',0); sp=s.stat('sp')
            sp*=pstats.get('proj_spd_mult',1.0)
            dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr')*dur_m
            pr=s.wd.get('pr',False); grv=s.wd.get('grv',0); br=s.wd.get('br',False)
            kb=s.wd.get('kb',(100,-50)); spr=s.wd.get('spr',0)
            frz=s.wd.get('freeze',0)*dur_m
            for i in range(ct):
                ba=0 if face>0 else math.pi
                if spr>0: ba+=(i-(ct-1)/2)*math.radians(spr/ct)
                objs.append(AtkObj(pcx,pcy,8,8,dmg,dur,s.color(),
                                   vel=[math.cos(ba)*sp,math.sin(ba)*sp],kb=kb,
                                   piercing=pr,grav=grv,boomerang=br,freeze_dur=frz,lifesteal=ls))
        elif t=='homing':
            ct=int(s.stat('ct'))+pstats.get('multishot',0); sp=s.stat('sp')
            sp*=pstats.get('proj_spd_mult',1.0)
            dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr')*dur_m
            hm=s.wd.get('hm',250); kb=s.wd.get('kb',(80,-40))
            for i in range(ct):
                a=i/max(1,ct)*math.tau
                objs.append(AtkObj(pcx,pcy,8,8,dmg,dur,s.color(),
                                   vel=[math.cos(a)*sp*0.3,math.sin(a)*sp*0.3],kb=kb,homing=hm,piercing=True,lifesteal=ls))
        elif t=='lightning':
            rng=s.stat('rng'); rad=s.stat('rad'); dmg=int(s.stat('dm')*dm_m)
            kb=s.wd.get('kb',(0,-200)); chain=s.wd.get('chain',1)
            hit_list=[]
            for _ in range(chain):
                best=None; bd=rng
                for e in enemies:
                    if not e.active or id(e) in hit_list: continue
                    d2=dst((pcx,pcy),e.ctr) if not hit_list else dst(hit_list[-1] if hit_list else (pcx,pcy),e.ctr)
                    if d2<bd: bd=d2; best=e
                if best:
                    objs.append(AtkObj(best.cx-rad,best.cy-rad,rad*2,rad*2,dmg,0.2,s.color(),kb=kb,lifesteal=ls))
                    hit_list.append(id(best))
                    pcx,pcy=best.cx,best.cy
        elif t=='area':
            mxr=s.stat('mxr')*pstats.get('area_mult',1.0)
            dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr',0.25)*dur_m
            kb=s.wd.get('kb',(0,-60)); sp=s.stat('sp')
            if sp>0:
                objs.append(AtkObj(pcx-10,pcy-10,20,20,dmg,dur,s.color(),kb=kb,piercing=True,expand=sp,lifesteal=ls))
            else:
                r=int(mxr); objs.append(AtkObj(pcx-r,pcy-r,r*2,r*2,dmg,dur,s.color(),kb=kb,piercing=True,lifesteal=ls))
        elif t=='rain':
            ct=int(s.stat('ct'))+pstats.get('multishot',0); sp=s.stat('sp')
            sp*=pstats.get('proj_spd_mult',1.0)
            dmg=int(s.stat('dm')*dm_m); dur=s.stat('dr')*dur_m
            kb=s.wd.get('kb',(30,-80))
            for i in range(ct):
                objs.append(AtkObj(pcx+random.uniform(-300,300),pcy-350,16,16,dmg,dur,
                                   s.color(),vel=[0,sp],kb=kb,piercing=True,grav=400,lifesteal=ls))
        elif t=='summon':
            ct=int(s.stat('ct'))+pstats.get('multishot',0); dur=s.stat('dur')*dur_m
            dmg=int(s.stat('dm')*dm_m); sp=s.stat('sp'); sz=s.wd.get('sz',12)
            for i in range(ct):
                objs.append(AtkObj(pcx+random.uniform(-30,30),pcy-30,sz,sz,dmg,dur,
                                   s.color(),vel=[random.uniform(-sp,sp),random.uniform(-sp,0)],
                                   kb=(80,-50),homing=150,piercing=True,hit_cd=0.5,lifesteal=ls))
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
            objs.append(AtkObj(x,pcy-4,SW,12,dmg,dur,s.color(),kb=kb,piercing=True,lifesteal=ls))
        elif t=='trail':
            dur=s.stat('dr')*dur_m; dmg=int(s.stat('dm')*dm_m)
            kb=s.wd.get('kb',(50,-30))
            objs.append(AtkObj(pcx-6,pcy+PH-12,12,12,dmg,dur,s.color(),kb=kb,piercing=True,hit_cd=0.2,lifesteal=ls))
        return objs

# ═══ CHARACTERS ═══
CHARS=[
    {'id':'padrao','n':'Quadrado','desc':'O herói retangular original',
     'ach':None,'weapons':['whip'],'know_idx':-1,'know_lv':0,'col':P_COL,'acc':P_ACC},
    {'id':'lamina','n':'Retângulo Lâmina','desc':'Veloz e mortal com facas',
     'ach':'first_blood','weapons':['knife'],'know_idx':-1,'know_lv':0,'col':(200,200,210),'acc':C_KNIFE},
    {'id':'gelido','n':'Retângulo Gélido','desc':'Gela tudo que toca',
     'ach':'survivor','weapons':['ice'],'know_idx':-1,'know_lv':0,'col':(150,200,255),'acc':C_ICE},
    {'id':'arcano','n':'Retângulo Arcano','d':'Mísseis mágicos + Poder','desc':'Mísseis + Poder',
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

# ═══ SPAWNER (harder) ═══
class Spawner:
    def __init__(s): s.timer=3.; s.cd=4.; s.mb_cd=150.; s.boss_cd=600.; s.mb_count=0; s.boss_count=0
    def update(s,dt,cx,cy,t):
        s.timer-=dt
        # Gradual: starts slow, ramps hard
        s.cd=max(0.4,4.-t/40.)
        es=[]
        if s.timer<=0:
            s.timer=s.cd; es.extend(s._wave(cx,cy,t))
        s.mb_cd-=dt
        if s.mb_cd<=0:
            s.mb_cd=max(90.,150.-t/10); s.mb_count+=1
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
        es=[]; types=[E_CRAWL]
        # Start with just 1-2 enemies; scale up gradually
        n=max(1,min(40,int(1+t/15.)))
        if t>15: types.append(E_SWARM)
        if t>30: types.append(E_FLY)
        if t>50: types.append(E_LEAP)
        if t>70: types.append(E_ARCH)
        if t>90: types.append(E_SPLIT)
        if t>110: types.append(E_CHRG)
        if t>130: types.append(E_EXPLO)
        if t>150: types.append(E_BRUTE)
        if t>180: types.append(E_SHIELD)
        if t>210: types.append(E_NECRO)
        if t>250: types.append(E_BOMBER)
        if t>320: types.append(E_GHOST)
        if t>400: types.append(E_WRAITH)
        gy=GROUND_ROW*TS
        for _ in range(n):
            et=random.choice(types); side=random.choice([-1,1])
            x=cx+side*(SW/2+50+random.random()*200)
            y=cy+random.uniform(-SH/3,SH/3) if et in (E_FLY,E_SWARM,E_GHOST,E_NECRO) else gy-E_DATA[et]['h']
            es.append(Enemy(x,y,et,t))
        return es
# ═══ PLAYER (limits + new knowledge) ═══
class Player:
    def __init__(s,part):
        s.pos=[0.,0.]; s.vel=[0.,0.]; s.gnd=False; s.face=1
        s.hp=100; s.max_hp=100; s.xp=0; s.level=1; s.xp_next=10
        s.weapons=[]; s.know=[0]*18; s.inv=0.; s.kills=0
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
    def add_xp(s,amt): s.xp+=int(amt*(1.0+s.know[6]*0.25))
    def check_lvup(s):
        if s.xp>=s.xp_next:
            s.xp-=s.xp_next; s.level+=1
            s.xp_next=int(10+s.level*8+s.level**1.5)
            s.hp=min(s.hp+15,s.max_hp); return True
        return False
    def apply_upgrade(s,utype,idx):
        if utype=='wnew': s.weapons.append(WeaponInst(WD[idx]))
        elif utype=='wup': s.weapons[idx].level+=1
        elif utype=='evo':
            old=s.weapons[idx]
            merged={**old.wd,**old.wd['evo']}
            s.weapons[idx]=WeaponInst(merged,from_evo=True)
        elif utype=='know':
            s.know[idx]+=1
            if idx==0: old=s.max_hp; s.max_hp=100+s.know[0]*25; s.hp+=s.max_hp-old
        elif utype=='heal': s.hp=s.max_hp
    def know_count(s): return sum(1 for k in s.know if k>0)
    def dmg_mult(s): return 1.0+s.know[1]*0.15
    def spd_mult(s): return 1.0+s.know[2]*0.15
    def cd_mult(s): return max(0.3,1.0-s.know[3]*0.15)
    def armor(s): return s.know[4]
    def magnet(s): return MAG_BASE*(1.0+s.know[5]*0.3+s.know[17]*0.4)
    def dur_mult(s): return 1.0+s.know[11]*0.1
    def multishot(s): return s.know[12]
    def proj_spd_mult(s): return 1.0+s.know[13]*0.2
    def area_mult(s): return 1.0+s.know[14]*0.15
    def crit_chance(s): return s.know[15]*0.1
    def lifesteal(s): return s.know[16]*0.02
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
            s.regen_t=2.0; reg=s.know[7]*0.3
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

# ═══ UPGRADE OPTIONS (show next level gain) ═══
def get_options(pl):
    opts=[]
    for i,w in enumerate(pl.weapons):
        if w.can_evo() and random.random()<0.25:
            evo=w.wd['evo']
            opts.append(('evo',i,f"★ EVOLUÇÃO: {evo['n']}",evo['d'],EVO_C))
        elif w.level<w.maxlv():
            nl=w.level+1; parts=[]
            if 'dm' in w.wd:
                dm=w.wd['dm']
                if isinstance(dm,tuple):
                    cur=dm[0]+(w.level-1)*dm[1]; nxt=dm[0]+nl*dm[1]
                    parts.append(f"Dano: {cur}→{nxt}")
            if 'cd' in w.wd:
                cd=w.wd['cd']
                if isinstance(cd,tuple):
                    cur=max(0.1,cd[0]+(w.level-1)*cd[1]); nxt=max(0.1,cd[0]+nl*cd[1])
                    parts.append(f"Recarga: {cur:.2f}→{nxt:.2f}s")
            if 'ct' in w.wd:
                ct=w.wd['ct']
                if isinstance(ct,tuple):
                    cur=int(ct[0]+(w.level-1)*ct[1]); nxt=int(ct[0]+nl*ct[1])
                    if nxt!=cur: parts.append(f"Projéteis: {cur}→{nxt}")
            if 'dur' in w.wd:
                dr=w.wd['dur']
                if isinstance(dr,tuple):
                    cur=dr[0]+(w.level-1)*dr[1]; nxt=dr[0]+nl*dr[1]
                    parts.append(f"Duração: {cur:.1f}→{nxt:.1f}s")
            if 'rad' in w.wd:
                rd=w.wd['rad']
                if isinstance(rd,tuple):
                    cur=rd[0]+(w.level-1)*rd[1]; nxt=rd[0]+nl*rd[1]
                    parts.append(f"Raio: {cur:.0f}→{nxt:.0f}")
            delta="  ·  ".join(parts) if parts else f"Nível {nl}"
            tag="★ " if w.evolved else ""
            opts.append(('wup',i,f"{tag}{w.name()} → Nv{nl}",delta,w.color()))
    owned_ids=[w.wd['id'] for w in pl.weapons]
    evo_ids=[w.wd.get('evo',{}).get('id','') for w in pl.weapons]
    if len(pl.weapons)<MAX_WEAPONS:
        for j,wd in enumerate(WD):
            if wd['id'] not in owned_ids and wd['id'] not in evo_ids:
                opts.append(('wnew',j,f"★ {wd['n']}",wd['d'],wd['c']))
    if pl.know_count()<MAX_KNOW:
        for j,k in enumerate(KNOW):
            if pl.know[j]<k['mx']:
                lv=pl.know[j]
                cur_desc=k['d']
                if pl.know[j]>0:
                    cur_desc=f"Atual: Nv{lv}  ·  Próximo: {k.get('nx',k['d'])}"
                opts.append(('know',j,f"{k['n']} Nv{lv+1}",cur_desc,k['c']))
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
    {'id':'evo_first','n':'Evolução','d':'Algo desperta dentro de você','hint':'Evolua uma arma pela primeira vez.'},
    {'id':'max_know','n':'Erudito','d':'Conhecimento é poder','hint':'Tenha 6 conhecimentos numa partida.'},
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
    if any(w.evolved for w in pl.weapons) and 'evo_first' not in aid: new.append('evo_first')
    if pl.know_count()>=6 and 'max_know' not in aid: new.append('max_know')
    for a in new: SAVE['achs'].append(a)
    save_disk(); return new

# ═══ DRAW FUNCTIONS (all PT-BR) ═══
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
        if w2<1 and h2<1: w2=h2=8
        sf=pygame.Surface((max(w2,20)+8,max(h2,20)+8),pygame.SRCALPHA)
        cc=cx_s=max(w2,20)//2+4; cy_s=max(h2,20)//2+4

        # ── Summon: green outline ──
        if a.homing>0 and a.hit_cd>=0.4:
            pygame.draw.rect(sf,(80,255,80,alpha//2),(2,2,max(w2,14),max(h2,14)),2,border_radius=4)
            pygame.draw.rect(sf,(*a.color[:3],alpha),(4,4,max(w2,10),max(h2,10)),border_radius=3)

        # ── Freeze beam ──
        elif a.freeze_dur>0:
            pygame.draw.line(sf,(*a.color,alpha),(cx_s,0),(cx_s,max(h2,20)+8),max(3,w2))
            pygame.draw.line(sf,(*WHITE,alpha//2),(cx_s,0),(cx_s,max(h2,20)+8),1)

        # ── Expanding area (fire ring, pentagram, poison, etc) ──
        elif a.expand>0:
            radius=max(2,w2//2)
            if a.color==C_POIS:
                # Poison: green bubbles
                for i in range(5):
                    bx2=cx_s+int(math.sin(a.age*3+i)*radius*0.3)
                    by2=cy_s+int(math.cos(a.age*4+i)*radius*0.3)
                    pygame.draw.circle(sf,(*C_POIS[:3],alpha//3),(bx2,by2),random.randint(3,6))
                pygame.draw.circle(sf,(*C_POIS[:3],alpha//2),(cx_s,cy_s),radius,2)
            else:
                pygame.draw.circle(sf,(*a.color[:3],alpha//2),(cx_s,cy_s),radius,3)
                pygame.draw.circle(sf,(*a.color[:3],alpha//4),(cx_s,cy_s),max(1,radius-4))

        # ── Thunder/Lightning ──
        elif a.color==C_THUN:
            # Lightning bolt effect
            pygame.draw.circle(sf,(*C_THUN[:3],alpha//3),(cx_s,cy_s),max(4,w2//2))
            pygame.draw.circle(sf,(*WHITE,alpha),(cx_s,cy_s),max(2,w2//4))
            # Jagged lines
            for i in range(4):
                ang=i/4*math.tau+a.age*5
                ex=cx_s+int(math.cos(ang)*w2*0.4)
                ey=cy_s+int(math.sin(ang)*h2*0.4)
                pygame.draw.line(sf,(*WHITE,alpha),(cx_s,cy_s),(ex,ey),2)

        # ── Laser/Corridor ──
        elif a.color==C_CORR:
            pygame.draw.rect(sf,(*a.color[:3],alpha),(2,cy_s-3,max(w2,20),6))
            glow=pygame.Surface((max(w2,20)+12,16),pygame.SRCALPHA)
            pygame.draw.rect(glow,(*a.color[:3],alpha//3),(0,0,max(w2,20)+12,16))
            surf.blit(glow,(x-6,y-8))

        # ── Cross boomerang ──
        elif a.color==C_CROSS:
            sz=max(6,w2//2)
            pygame.draw.line(sf,(*C_CROSS,alpha),(cx_s-sz,cy_s),(cx_s+sz,cy_s),3)
            pygame.draw.line(sf,(*C_CROSS,alpha),(cx_s,cy_s-sz),(cx_s,cy_s+sz),3)
            pygame.draw.circle(sf,(*WHITE,alpha//2),(cx_s,cy_s),3)

        # ── Axes (rotating) ──
        elif a.color==C_AXE:
            ang=a.age*12
            sz=max(6,w2//2)
            for i in range(4):
                ea=ang+i*math.pi/2
                ex=cx_s+int(math.cos(ea)*sz)
                ey=cy_s+int(math.sin(ea)*sz)
                pygame.draw.line(sf,(*C_AXE,alpha),(cx_s,cy_s),(ex,ey),3)
            pygame.draw.circle(sf,(*WHITE,alpha//3),(cx_s,cy_s),2)

        # ── Bones ──
        elif a.color==C_BONE:
            ang=math.atan2(a.vel[1],a.vel[0]) if abs(a.vel[0])>1 or abs(a.vel[1])>1 else 0
            sz=max(6,w2//2)
            ex=cx_s+int(math.cos(ang)*sz); ey=cy_s+int(math.sin(ang)*sz)
            sx2=cx_s-int(math.cos(ang)*sz); sy2=cy_s-int(math.sin(ang)*sz)
            pygame.draw.line(sf,(*C_BONE,alpha),(sx2,sy2),(ex,ey),3)
            pygame.draw.circle(sf,(*C_BONE,alpha),(ex,ey),3)
            pygame.draw.circle(sf,(*C_BONE,alpha),(sx2,sy2),3)

        # ── Missiles (arrow/teardrop) ──
        elif a.color==C_MISS:
            ang=math.atan2(a.vel[1],a.vel[0]) if (abs(a.vel[0])>1 or abs(a.vel[1])>1) else 0
            sz=6
            pts=[]
            pts.append((cx_s+int(math.cos(ang)*sz*1.5),cy_s+int(math.sin(ang)*sz*1.5)))
            pts.append((cx_s+int(math.cos(ang+2.5)*sz),cy_s+int(math.sin(ang+2.5)*sz)))
            pts.append((cx_s+int(math.cos(ang-2.5)*sz),cy_s+int(math.sin(ang-2.5)*sz)))
            pygame.draw.polygon(sf,(*C_MISS,alpha),pts)
            pygame.draw.circle(sf,(*WHITE,alpha//2),(cx_s,cy_s),2)

        # ── Knives (thin lines) ──
        elif a.color in (C_KNIFE,(240,240,255)):
            ang=math.atan2(a.vel[1],a.vel[0]) if (abs(a.vel[0])>1 or abs(a.vel[1])>1) else 0
            sz=8
            ex=cx_s+int(math.cos(ang)*sz); ey=cy_s+int(math.sin(ang)*sz)
            sx2=cx_s-int(math.cos(ang)*sz); sy2=cy_s-int(math.sin(ang)*sz)
            pygame.draw.line(sf,(*WHITE,alpha),(sx2,sy2),(ex,ey),2)
            pygame.draw.circle(sf,(*C_KNIFE,alpha),(ex,ey),2)

        # ── Fire ──
        elif a.color==C_FIRE:
            for i in range(3):
                r2=max(2,w2//2-i*3)
                a2=max(10,alpha-i*60)
                pygame.draw.circle(sf,(255,140+i*30,40,a2),(cx_s,cy_s-i*2),r2)

        # ── Water drops ──
        elif a.color==C_WATER:
            pygame.draw.circle(sf,(*C_WATER[:3],alpha),(cx_s,cy_s),max(3,w2//3))
            pygame.draw.circle(sf,(*WHITE,alpha//3),(cx_s-1,cy_s-1),max(1,w2//6))

        # ── Victory Sword / Moonlight (big arc) ──
        elif a.color in (C_VSWORD,C_MOON,C_VAND):
            pygame.draw.rect(sf,(*a.color[:3],alpha),(2,2,max(w2,20),max(h2,20)),border_radius=6)
            # Glow
            pygame.draw.rect(sf,(*WHITE,alpha//4),(4,4,max(w2,16),max(h2,16)),border_radius=4)

        # ── Shield pulse ──
        elif a.color==C_LAUREL:
            pygame.draw.circle(sf,(*C_LAUREL[:3],alpha//2),(cx_s,cy_s),max(4,w2//2),3)
            pygame.draw.circle(sf,(*C_LAUREL[:3],alpha//4),(cx_s,cy_s),max(2,w2//3))

        # ── Mortalha/Pentagrama burst (no expand) ──
        elif a.color in (C_SHROUD,C_PENTA):
            pygame.draw.circle(sf,(*a.color[:3],alpha//2),(cx_s,cy_s),max(4,w2//2),2)
            for i in range(5):
                ang=i/5*math.tau-math.pi/2
                px3=cx_s+int(math.cos(ang)*w2*0.3)
                py3=cy_s+int(math.sin(ang)*h2*0.3)
                pygame.draw.circle(sf,(*a.color[:3],alpha//3),(px3,py3),3)

        # ── Trail (pinion) ──
        elif a.color==C_PINION:
            pygame.draw.circle(sf,(*C_PINION[:3],alpha),(cx_s,cy_s),max(3,w2//2))
            pygame.draw.circle(sf,(*WHITE,alpha//3),(cx_s,cy_s),max(1,w2//4))

        # ── Generic fallback ──
        else:
            pygame.draw.rect(sf,(*a.color[:3],alpha),(2,2,max(w2,16),max(h2,16)),border_radius=4)

        surf.blit(sf,(x-4,y-4))

    # ── Orbit orbs ──
    for w in pl.weapons:
        if w.wtype() in ('orbit_proj','orbit'):
            st_c=int(w.stat('ct')); st_r=w.stat('rad'); st_sz=int(w.stat('sz',8))
            for i in range(max(1,st_c)):
                ang=w.orbit_angle+i*(math.tau/st_c)
                opx=pl.cx+math.cos(ang)*st_r-ox; opy=pl.cy+math.sin(ang)*st_r-oy
                # Bible = book shape; others = circle
                if w.color()==C_BIBLE:
                    pygame.draw.rect(surf,w.color(),(int(opx-st_sz//2),int(opy-st_sz//2),st_sz,st_sz),border_radius=2)
                    pygame.draw.line(surf,WHITE,(int(opx),int(opy-st_sz//2)),(int(opx),int(opy+st_sz//2)),1)
                else:
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
        wx=20+i*42
        col=w.color()
        if w.evolved: col=EVO_C
        # Solid color card instead of empty square
        pygame.draw.rect(surf,col,(wx,wy,34,34),border_radius=6)
        # Darker inner
        inner=tuple(max(0,c-60) for c in col)
        pygame.draw.rect(surf,inner,(wx+3,wy+3,28,28),border_radius=4)
        rtxt(surf,FONT_S,str(w.level),(wx+12,wy+8),WHITE)
        # Weapon initial letter
        letter=w.name()[0].upper()
        rtxt(surf,FONT_S,letter,(wx+18,wy+18),WHITE)
    kwy=wy
    for i,lv in enumerate(pl.know):
        if lv>0:
            px=SW-36-i*32; pygame.draw.rect(surf,KNOW[i]['c'],(px,kwy,26,26),border_radius=3)
            rtxt(surf,FONT_S,str(lv),(px+8,kwy+8),WHITE)
    if achs_new:
        for i,aid in enumerate(achs_new):
            a=next((x for x in ACHS if x['id']==aid),None)
            if a: rtxt(surf,FONT_M,f"★ {a['n']}",(SW//2,80+i*30),(255,220,100),center=True)

def draw_lvup(surf,opts,sel):
    ov=pygame.Surface((SW,SH),pygame.SRCALPHA); ov.fill((0,0,0,180)); surf.blit(ov,(0,0))
    rtxt(surf,FONT_L,"S U B I U   D E   N Í V E L !",(SW//2,140),P_ACC,center=True)
    for i,(_,_,name,desc,col) in enumerate(opts):
        y=220+i*130; sel2=(i==sel); bw3,bh2=500,100; bx3=SW//2-bw3//2
        bg2=(40,45,65) if not sel2 else (55,60,85); brd=col if sel2 else (60,65,85)
        pygame.draw.rect(surf,bg2,(bx3,y,bw3,bh2),border_radius=6)
        pygame.draw.rect(surf,brd,(bx3,y,bw3,bh2),2,border_radius=6)
        pygame.draw.rect(surf,col,(bx3+12,y+12,8,bh2-24),border_radius=2)
        rtxt(surf,FONT_M,name,(bx3+32,y+20),WHITE if sel2 else UI_C)
        rtxt(surf,FONT_S,desc,(bx3+32,y+55),UI_DIM)
        if sel2: rtxt(surf,FONT_M,"▶",(bx3-30,y+30),col)
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
        col2=ch['col'] if unlocked else (50,50,60); acc2=ch['acc'] if unlocked else (60,60,70)
        pygame.draw.rect(surf,col2,(215,y+12,20,36))
        pygame.draw.rect(surf,acc2,(220,y+28,10,6))
        if unlocked:
            rtxt(surf,FONT_M,ch['n'],(250,y+8),WHITE if sel2 else UI_C)
            wname=next((w['n'] for w in WD if w['id']==ch['weapons'][0]),'?')
            extra=f"  |  Conhecimento: {KNOW[ch['know_idx']]['n']}" if ch['know_idx']>=0 else ""
            rtxt(surf,FONT_S,f"Arma: {wname}{extra}",(250,y+35),UI_DIM)
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
        desc=ENEMY_DESC.get(eid,'')
        rtxt(surf,FONT_S,f"{desc}  ·  HP:{ed['hp']} DMG:{ed['dmg']}",(100,y+28),UI_DIM)
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
        evo_n=""
        if 'evo' in wd: evo_n=f"  → {wd['evo']['n']}"
        rtxt(surf,FONT_M,f"{wd['n']}{evo_n}",(75,y+5),WHITE)
        rtxt(surf,FONT_S,f"Tipo: {wd['t']}  |  Nível Máx: {wd['ml']}",(75,y+30),UI_DIM)
        rtxt(surf,FONT_S,wd['d'],(75,y+48),UI_C)
    pages=(len(WD)+per_page-1)//per_page
    rtxt(surf,FONT_S,f"Página {page+1}/{pages}    ←→ Mudar    ESC Voltar",(SW//2,SH-130),UI_DIM,center=True)
    ky=SH-110; rtxt(surf,FONT_M,"Conhecimento (Passivas)",(SW//2,ky),P_ACC,center=True)
    for j,k in enumerate(KNOW):
        x=30+j*68
        if x>SW-50: break
        pygame.draw.rect(surf,k['c'],(x,ky+30,18,18),border_radius=3)
        rtxt(surf,FONT_S,k['n'][:5],(x,ky+50),UI_DIM)

def draw_achievements(surf):
    surf.fill(BG)
    rtxt(surf,FONT_L,"C O N Q U I S T A S",(SW//2,30),P_ACC,center=True)
    for i,a in enumerate(ACHS):
        y=70+i*45; unlocked=a['id'] in SAVE['achs']
        col3=(255,220,100) if unlocked else UI_DIM; icon="★" if unlocked else "?"
        rtxt(surf,FONT_M,f"{icon}  {a['n']}",(60,y),col3)
        hint=a['d'] if unlocked else a['hint']
        rtxt(surf,FONT_S,hint,(100,y+22),UI_C if unlocked else UI_DIM)
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
        if inp.just(pygame.K_ESCAPE):
            if state==ST_TITLE: break
            elif state in (ST_INDEX,ST_BOOK,ST_ACHS,ST_CHARSEL): state=ST_TITLE
            elif state==ST_LVUP: state=ST_PLAY
            elif state in (ST_PLAY,): state=ST_TITLE
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

        # ── CHAR SELECT ──
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

        elif state==ST_INDEX:
            if inp.just(pygame.K_LEFT): index_page=max(0,index_page-1)
            if inp.just(pygame.K_RIGHT): index_page=min((len(ENEMY_NAMES)+6)//7-1,index_page+1)
        elif state==ST_BOOK:
            if inp.just(pygame.K_LEFT): book_page=max(0,book_page-1)
            if inp.just(pygame.K_RIGHT): book_page=min((len(WD)+5)//6-1,book_page+1)

        # ── PLAY ──
        elif state==ST_PLAY:
            time_s+=dt; hit_timer+=dt; pl.update(inp,world.solids,dt); achs_timer-=dt
            if not pl.alive:
                SAVE['best']=max(SAVE['best'],int(time_s)); save_disk(); state=ST_OVER; continue
            if time_s>=MAX_TIME:
                SAVE['best']=max(SAVE['best'],int(time_s)); save_disk(); state=ST_VICTORY; continue
            world.update(pl.pos[0])

            pstats={'cd_mult':pl.cd_mult(),'dmg_mult':pl.dmg_mult(),'dur_mult':pl.dur_mult(),
                    'multishot':pl.multishot(),'proj_spd_mult':pl.proj_spd_mult(),
                    'area_mult':pl.area_mult(),'lifesteal':pl.lifesteal()}
            for w in pl.weapons:
                if w.wtype() in ('orbit_proj','orbit'): continue
                if w.wtype()=='shield':
                    w.timer-=dt*pl.cd_mult()
                    if w.timer<=0: w.timer=max(0.5,w.stat('cd')); pl.shield_t=w.stat('dur')*pl.dur_mult()
                    continue
                if w.wtype()=='trail' and abs(pl.vel[0])<50: continue
                w.timer-=dt*pl.cd_mult()
                if w.timer<=0:
                    w.timer=max(0.1,w.stat('cd'))
                    na=w.fire(pl.cx,pl.cy,pl.face,enemies,pstats)
                    attacks.extend(na)
                    if na and w.wtype()=='melee':
                        # Big slash particle effect
                        pl.part.directed([pl.cx+pl.face*30,pl.cy],
                                        [pl.face,-0.3],6,1.0,150,.25,4,w.color())
                        pl.part.directed([pl.cx+pl.face*30,pl.cy],
                                        [pl.face,0.3],6,1.0,150,.25,4,w.color())
                    if na: cam.shake(2,0.05)

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

            for a in attacks:
                a.update(dt,enemies if a.homing else None)
                if not a.active: continue
                if a.freeze_dur>0:
                    for e in enemies:
                        if e.active and a.box.ov(e.box): e.frozen=a.freeze_dur
                for e in enemies:
                    if not e.active or id(e) in a.hit: continue
                    if a.box.ov(e.box):
                        dmg=a.dmg
                        if random.random()<pl.crit_chance(): dmg=int(dmg*2.5)
                        kb=(sign(e.cx-pl.cx)*abs(a.kb[0]),a.kb[1])
                        e.take_hit(dmg,kb); a.hit.add(id(e))
                        if a.lifesteal>0: pl.hp=min(pl.max_hp,pl.hp+int(dmg*a.lifesteal))
                        part.burst(e.ctr,5,100,0.2,3,alp(a.color,200)); cam.shake(2,0.05)
                        if not a.piercing: a.active=False; break
            attacks=[a for a in attacks if a.active]

            for e in enemies: e.update(pl.ctr,world.solids,dt,enemies,time_s)

            if pl.inv<=0 and pl.shield_t<=0:
                for e in enemies:
                    if not e.active: continue
                    eb=AABB(e.pos[0]-4,e.pos[1]-4,e.w+8,e.h+8)
                    if pl.box.ov(eb):
                        pl.take_dmg(e.dmg); cam.shake(6,0.12)
                        part.burst(pl.ctr,10,150,0.3,3,alp(DMG_F,200))
                        pl.vel[0]=sign(pl.cx-e.cx)*200; pl.vel[1]=-150; hit_timer=0; break
            if pl.inv<=0 and pl.shield_t<=0:
                for e in enemies:
                    if not e.active: continue
                    if pl.box.ov(e.box):
                        pl.take_dmg(e.dmg); cam.shake(6,0.12)
                        part.burst(pl.ctr,10,150,0.3,3,alp(DMG_F,200))
                        pl.vel[0]=sign(pl.cx-e.cx)*200; pl.vel[1]=-150; hit_timer=0; break

            alive=[]
            for e in enemies:
                if e.active: alive.append(e)
                else:
                    kills+=1; pl.kills=kills
                    eid_str=str(e.et); SAVE['kills'][eid_str]=SAVE['kills'].get(eid_str,0)+1
                    if e.is_boss: boss_killed=True
                    if e.is_mb: mb_killed=True
                    # Splitter: spawn 2 small copies
                    if e.et==E_SPLIT and not e.is_boss:
                        for _ in range(2):
                            baby=Enemy(e.cx+random.uniform(-20,20),e.cy,E_SWARM,0)
                            baby.hp=baby.mhp=8; baby.xp=2
                            alive.append(baby)
                    # Exploder: area damage
                    if e.et==E_EXPLO and not e.is_boss:
                        for e2 in alive:
                            if e2.active and dst(e.ctr,e2.ctr)<120:
                                e2.take_hit(20,(sign(e2.cx-e.cx)*200,-100))
                    rem=e.xp
                    while rem>0:
                        if rem>=10: gems.append(Gem(e.cx+random.uniform(-5,5),e.cy,10)); rem-=10
                        elif rem>=3: gems.append(Gem(e.cx+random.uniform(-5,5),e.cy,3)); rem-=3
                        else: gems.append(Gem(e.cx+random.uniform(-5,5),e.cy,1)); rem-=1
                    part.burst(e.ctr,15,200,0.4,4,alp(e.col,255))
            enemies=alive

            mag=pl.magnet()
            for g in gems:
                g.update(pl.ctr,mag,dt)
                if g.active and dst(g.pos,pl.ctr)<20:
                    g.active=False; pl.add_xp(g.value); gems_col+=1
                    part.burst(g.pos,4,60,0.15,2,alp(g.color,200))
            gems=[g for g in gems if g.active]

            if pl.check_lvup(): state=ST_LVUP; lv_opts=get_options(pl); lv_sel=0

            ne=spawner.update(dt,cam.x+SW/2,cam.y+SH/2,time_s); enemies.extend(ne)

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