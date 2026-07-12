#!/usr/bin/env python3
"""Pip's Boss Rush - Python/Pygame Enhanced Edition"""
import pygame, json, os, math, random, sys, socket
from pathlib import Path

pygame.init()
W, H, GND, FPS = 800, 500, 440, 60
screen = pygame.display.set_mode((W, H))
pygame.display.set_caption("Pip's Boss Rush")
fullscreen=False
clock = pygame.time.Clock()

# ── COLORS ───────────────────────────────────────────────
BLACK=(0,0,0); WHITE=(255,255,255); GOLD=(255,215,0); RED=(229,57,53)
GREEN=(76,175,80); BLUE=(33,150,243); ORANGE=(232,124,58); GRAY=(136,136,136)
DGREY=(51,51,51); PINK=(233,30,99); PURPLE=(156,39,176); YELLOW=(255,235,59)
BROWN=(121,85,72); CYAN=(0,188,212); LTBLUE=(100,181,246)
DKRED=(183,28,28); DKGREEN=(27,94,32); DKPURPLE=(74,20,140); DKBLUE=(13,71,161)
BG_GRAD=[((15,43,15),(7,26,7)),((26,37,53),(10,16,32)),((10,26,43),(0,10,21)),((26,10,43),(10,0,26))]

# ── FONTS ────────────────────────────────────────────────
_fc={}
def F(sz,bold=False):
    k=(sz,bold)
    if k not in _fc:_fc[k]=pygame.font.SysFont("couriernew,courier,monospace",sz,bold=bold)
    return _fc[k]
def txt(s,text,x,y,c=WHITE,sz=14,bold=False,center=False,right=False):
    r=F(sz,bold).render(str(text),True,c);rc=r.get_rect()
    if center:rc.centerx=x;rc.top=y
    elif right:rc.right=x;rc.top=y
    else:rc.topleft=(x,y)
    s.blit(r,rc)

# ── UTILITIES ────────────────────────────────────────────
clamp=lambda v,a,b:max(a,min(b,v));rng=lambda a,b:random.uniform(a,b)
dist=lambda x1,y1,x2,y2:math.hypot(x2-x1,y2-y1)
dirst=lambda a,b:1 if b>a else -1
TAU=math.tau
def wrap_x(x,w=32):
    if x>W:x-=W+w
    if x+w<0:x+=W+w
    return x
def wrap_bx(x):
    if x>W+15:x-=W+30
    if x<-15:x+=W+30
    return x
def hit_cr(cx,cy,cr,rx,ry,rw,rh):
    return dist(cx,cy,clamp(cx,rx,rx+rw),clamp(cy,ry,ry+rh))<cr
def lerp_c(c1,c2,t):
    t=clamp(t,0,1)
    return tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(min(len(c1),len(c2))))

def draw_grad(surf,rect,c1,c2):
    x,y,w,h=rect
    for i in range(h):
        surf.fill(lerp_c(c1,c2,i/h if h else 0),(x,y+i,w,1))

# ═══ PARTICLE SYSTEM ════════════════════════════════════
particles=[]
def burst(x,y,n,c,ss,se,sz,sze,life):
    for _ in range(n):
        a=rng(0,TAU);sp=rng(ss,se)
        particles.append({'x':x,'y':y,'vx':math.cos(a)*sp,'vy':math.sin(a)*sp,
            'c':c,'s':rng(sz,sze),'l':life,'ml':life})
def u_pts(dt):
    for p in particles[:]:
        p['l']-=dt;p['x']+=p['vx'];p['y']+=p['vy'];p['vy']+=0.04
        if p['l']<=0:particles.remove(p)
def d_pts(surf):
    for p in particles:
        a=clamp(p['l']/p['ml'],0,1);s=int(p['s']*a)
        if s>=1:pygame.draw.circle(surf,p['c'],(int(p['x']),int(p['y'])),s)

# ═══ CONFIG ═════════════════════════════════════════════
WPNS=[
    {'n':'Manifestacao','cost':0,'own':1,'c':GREEN,'tp':'pea'},
    {'n':'Boomerang','cost':2,'own':0,'c':BLUE,'tp':'boom'},
    {'n':'Cesta Vaia','cost':2,'own':0,'c':(220,20,60),'tp':'tomato'},
    {'n':'Mascara Tragica','cost':2,'own':0,'c':(180,180,200),'tp':'mask'},
    {'n':'Shuriken','cost':2,'own':0,'c':(192,192,192),'tp':'shuriken'},
    {'n':'Microfone','cost':2,'own':0,'c':(200,100,255),'tp':'mic'},
    {'n':'Pimenta','cost':2,'own':0,'c':(200,0,0),'tp':'pepper'},
    {'n':'Camera Retorno','cost':2,'own':0,'c':(100,200,255),'tp':'camera'},
    {'n':'Martelo','cost':3,'own':0,'c':(160,82,45),'tp':'nail'},
    {'n':'Escudo Guardiao','cost':3,'own':0,'c':(70,130,180),'tp':'shield'},
    {'n':'Vara de Pesca','cost':3,'own':0,'c':(0,150,136),'tp':'rod'},
    {'n':'Coroa Rei','cost':3,'own':0,'c':(255,215,0),'tp':'crown'},
    {'n':'Caca-Niquel','cost':3,'own':0,'c':(255,0,128),'tp':'slots'},
    {'n':'Spread','cost':4,'own':0,'c':ORANGE,'tp':'spr'},
    {'n':'Lightning','cost':4,'own':0,'c':YELLOW,'tp':'bolt'},
    {'n':'Bomb','cost':4,'own':0,'c':(255,152,0),'tp':'bomb'},
    {'n':'Anel Fogo','cost':4,'own':0,'c':(255,69,0),'tp':'firering'},
    {'n':'Homing','cost':5,'own':0,'c':PINK,'tp':'home'},
    {'n':'Caixa Taixinha','cost':5,'own':0,'c':(255,193,7),'tp':'matchbox'},
    {'n':'Canhao Sangue','cost':5,'own':0,'c':(139,0,0),'tp':'blood'},
]

W_DMG={'pea':1,'boom':2,'tomato':2,'mask':0,'shuriken':1,'mic':4,'pepper':1,
       'camera':0,'nail':1,'shield':3,'rod':2,'crown':2,'slots':0,
       'spr':1,'bolt':1,'bomb':10,'firering':2,'home':2,'matchbox':1,'blood':4}


CFG={'pHP':3,'pSpd':5,'pJf':11,'pJS':6.5,'pDD':160,'pDS':16,'pDC':800,'pInv':1000,
     'wR':[120,200,500,600,200,800,400,5000,350,3000,400,300,350,150,280,450,2500,300,3000,380]}

SECS=[{'n':'TERRA','c':GREEN,'bosses':[0,1,2,3,4]},
      {'n':'MONTANHA','c':GRAY,'bosses':[5,6,7,8,9]},
      {'n':'CEU','c':LTBLUE,'bosses':[10,11,12,13,14]},
      {'n':'FINAL','c':GOLD,'bosses':[15]}]
CTRLS=[{'left':pygame.K_a,'right':pygame.K_d,'jump':pygame.K_w,
        'shoot':pygame.K_j,'dash':pygame.K_k,'swap':pygame.K_l,'special':pygame.K_u},
       {'left':pygame.K_LEFT,'right':pygame.K_RIGHT,'jump':pygame.K_UP,
        'shoot':pygame.K_PERIOD,'dash':pygame.K_COMMA,'swap':pygame.K_SLASH,'special':pygame.K_SEMICOLON}]


# ── SECRET WEAPONS SYSTEM ──
SECRET_WPNS=[
    {'n':'A Forca','cost':0,'own':0,'c':(200,0,0),'tp':'piano','passive':'Distorcao da Realidade'},
]
SECRET_TP=set(['piano'])  # secret types — never shown in shop
W_DMG['piano_throw']=12;W_DMG['piano_note']=2;W_DMG['piano_laser']=1
CFG['wR'].extend([300])  # piano throw rate

# Piano state
piano_variant=0  # 0=throw, 1=notes, 2=laser
piano_passive_timer=0
piano_passive_effect=None
piano_passive_dur=0
special_charge=0  # 0-100
special_active=False
special_opts=[]
special_sel=0
piano_laser_active=False
piano_laser_power=0
wish_active=False
wish_opts=[]
wish_sel=0
wish_timer=0
wish_thunder_pts=[]

secret_synergy_bosses=0  # bosses derrotados com sinergia ativa
secret_unlocked=False

# ═══ SAVE SYSTEM ════════════════════════════════════════
SVP=Path(os.path.expanduser("~"))/".pip_boss_rush.json"
def load_saves():
    if SVP.exists():
        try:return json.loads(SVP.read_text())
        except:pass
    return[None,None,None]
def write_saves(s):
    try:SVP.write_text(json.dumps(s))
    except:pass
saves_data=load_saves();cur_save=-1;coins=0
b_coins=[0]*16;b_clear=[0]*16;equipped=[0,0]
loadout=[0,0,0]
loadout_active=0  
first_play=True;post_b1=False;

remote_keys={}
net_mode="local";net_sock=None;net_conn=None
net_connected=False;net_status="";net_ip_input=""
net_port=5555;net_frame=0;lobby_timer=0;_sec_t=0
def reset_save():
    global coins,b_coins,b_clear,equipped,first_play,post_b1,loadout,loadout_active
    global secret_synergy_bosses,secret_unlocked
    coins=0;b_coins=[0]*16;b_clear=[0]*16
    for w in WPNS:
        if w.get('tp') not in SECRET_TP:w['own']=1 if w['cost']==0 else 0
    equipped=[0,0];first_play=True;post_b1=False
    loadout=[0,-1,-1];loadout_active=0
    secret_synergy_bosses=0;secret_unlocked=False
def save_game():
    if cur_save<0:return
    saves_data[cur_save]={'coins':coins,'bc':b_coins[:],'bl':b_clear[:],
        'wp':[w['own'] for w in WPNS],'eq':equipped[:],'fp':first_play,'pb':post_b1,
        'lo':loadout[:],'ssb':secret_synergy_bosses,'su':secret_unlocked}
    write_saves(saves_data)

def has_secret():
    for i in range(3):
        if loadout[i]>=0 and loadout[i]<len(WPNS) and WPNS[loadout[i]].get('tp') in SECRET_TP:
            return True
    return False

def equip_secret(idx):
    """idx = index in SECRET_WPNS list"""
    # Add to WPNS if not present
    for i,w in enumerate(WPNS):
        if w.get('tp')==SECRET_WPNS[idx]['tp']:return i
    WPNS.append(SECRET_WPNS[idx].copy())
    return len(WPNS)-1

def activate_secret():
    """Called when player unlocks a secret weapon"""
    global loadout,loadout_active
    idx=equip_secret(0)  # A Força
    loadout=[idx,-1,-1]
    loadout_active=0
    for i,w in enumerate(WPNS):
        if w.get('tp') not in SECRET_TP:w['own_save']=w.get('own',0)
    WPNS[idx]['own']=1
def load_save(idx):
    global cur_save,coins,b_coins,b_clear,equipped,first_play,post_b1,loadout,loadout_active
    global secret_synergy_bosses,secret_unlocked
    cur_save=idx;s=saves_data[idx]
    if s:
        coins=s.get('coins',0);b_coins=(s.get('bc',[])+[0]*16)[:16]
        b_clear=(s.get('bl',[])+[0]*16)[:16]
        wp=s.get('wp',[])
        for i,w in enumerate(WPNS):
            if w.get('tp') not in SECRET_TP:w['own']=wp[i] if i<len(wp) else(1 if w['cost']==0 else 0)
        equipped=s.get('eq',[0,0])[:];first_play=s.get('fp',True);post_b1=s.get('pb',False)
        loadout=s.get('lo',[0,-1,-1])[:3]
        while len(loadout)<3:loadout.append(-1)
        loadout_active=0
        secret_synergy_bosses=s.get('ssb',0);secret_unlocked=s.get('su',False)
        if secret_unlocked:equip_secret(0)
    else:reset_save();save_game()
def del_sv(i):saves_data[i]=None;write_saves(saves_data)
def sec_ok(s):
    if s==0:return True
    return all(b_clear[b] for b in SECS[s-1]['bosses'])
def boss_ok(idx):
    s=BDATA[idx]['s'];bl=SECS[s]['bosses']
    for i,b in enumerate(bl):
        if b==idx:return sec_ok(s) if i==0 else bool(b_clear[bl[i-1]])
    return False
def medal_bonus():return sum(1 for i in range(16) if(b_coins[i]&7)==7)

# ═══ PLAYER ═════════════════════════════════════════════
def mk_p(pid):
    return{'id':pid,'x':100+pid*80,'y':GND-44,'w':32,'h':44,'vx':0,'vy':0,
        'spd':CFG['pSpd'],'jf':-CFG['pJf'],'hp':CFG['pHP'],'mhp':CFG['pHP'],
        'gnd':False,'face':1,'inv':0,'anim':0,'jc':0,'jH':False,
        'dash':False,'dT':0,'dCD':0,'dDir':1,'pullX':0,'pullStr':0,'pullDur':0,
        'alive':True,'deadT':0,'equipped':equipped[pid] if pid<len(equipped) else 0,
        'lsht':0,'pk':{},'binds':CTRLS[min(pid,1)],
        'fr_count':0,'fr_timer':0,'fr_next_ang':0,
        'rod_hook':None,'shield_timer':0,
        'shuriken_count':3,'shuriken_group':0}

def p_h(p,a):
    k=p['binds'][a]
    if net_mode!='local' and p['id']!=local_pid:return remote_keys.get(k,False)
    return keys.get(k,False)

def p_j(p,a):
    k=p['binds'][a]
    if net_mode!='local' and p['id']!=local_pid:dn=remote_keys.get(k,False)
    else:dn=keys.get(k,False)
    was=p['pk'].get(a,False);p['pk'][a]=dn;return dn and not was

def near_p(tx,ty):
    best=None;bd=99999
    for p in players:
        if not p['alive']:continue
        d=dist(p['x']+16,p['y']+22,tx,ty)
        if d<bd:bd=d;best=p
    return best
def any_al():return any(p['alive'] for p in players)
def all_de():return all(not p['alive'] for p in players)

def u_player_extras(p,dt):
    global piano_variant
    if p.get('shield_timer',0)>0:p['shield_timer']-=dt
    # Reset speed if not using laser
    if p['equipped']<len(WPNS) and WPNS[p['equipped']]['tp']=='piano':
        if piano_variant!=2 or not p_h(p,'shoot'):
            p['spd']=CFG['pSpd']
    for mv in mic_visuals[:]:
        mv['t']+=dt
        if mv['t']>=mv['dur']:mic_visuals.remove(mv)
    u_special_charge(dt)

def u_player(p,dt):
    global piano_variant,loadout_active
    if not p['alive']:
        if num_players>=2:
            p['deadT']+=dt
            if p['deadT']>15000 and any_al():
                p.update(alive=True,hp=1,inv=3000,deadT=0,x=100,y=GND-44)
                u_player_extras(p,dt)
        return
    p['anim']+=dt
    if p['dCD']>0:p['dCD']-=dt
    if p['pullDur']>0:
        p['pullDur']-=dt;p['x']+=dirst(p['x']+16,p['pullX'])*p['pullStr']
    if p['dash']:
        p['dT']-=dt;p['x']+=p['dDir']*CFG['pDS']
        if p['dT']<=0:p['dash']=False;p['dCD']=CFG['pDC']
    else:
        mx=0
        if p_h(p,'left'):mx=-1;p['face']=-1
        if p_h(p,'right'):mx=1;p['face']=1
        p['vx']=mx*p['spd'];p['x']+=p['vx']
        if p_j(p,'jump') and p['jc']<2:
            p['vy']=-CFG['pJS'];p['jc']+=1;p['gnd']=False;p['jH']=True
        if p_h(p,'jump') and p['jH'] and p['vy']<0:
            p['vy']-=0.65
            if p['vy']<p['jf']:p['vy']=p['jf']
        if not p_h(p,'jump') and p['vy']<-3:p['vy']=-3;p['jH']=False
        if p_j(p,'dash') and p['dCD']<=0:
            p['dash']=True;p['dT']=CFG['pDD'];p['dDir']=p['face'];p['vy']=0
        # ── SWAP: piano troca variante, outros trocam loadout slot ──
        if p['id']==local_pid and p_j(p,'swap'):
            is_piano=p['equipped']<len(WPNS) and WPNS[p['equipped']]['tp']=='piano'
            if is_piano:
                piano_variant=(piano_variant+1)%3
            else:
                loadout_active=(loadout_active+1)%3
                if loadout[loadout_active]>=0:
                    p['equipped']=loadout[loadout_active]
    p['vy']+=0.55;p['y']+=p['vy']
    if p['y']+p['h']>=GND:
        p['y']=GND-p['h'];p['vy']=0;p['gnd']=True;p['jc']=0;p['jH']=False
    p['x']=wrap_x(p['x'])
    if p['inv']>0:p['inv']=max(0,p['inv']-dt)
    # ── TECLAS 1/2/3: piano troca variante, outros trocam arma ──
    if p['id']==local_pid:
        is_piano=p['equipped']<len(WPNS) and WPNS[p['equipped']]['tp']=='piano'
        for i in range(1,min(len(loadout),9)+1):
            k=getattr(pygame,f'K_{i}',None)
            if k and jp(k):
                if is_piano and i<=3:
                    piano_variant=i-1
                elif not is_piano and loadout[i-1]>=0:
                    p['equipped']=loadout[i-1]
    u_player_extras(p,dt)

def d_player(surf,p):
    cx,cy=p['x']+16,p['y']+22
    bob=math.sin(p['anim']*0.008)*2 if p['gnd'] else 0
    cb=ORANGE if p['id']==0 else(79,195,247);cc=BLUE if p['id']==0 else ORANGE
    if not p['alive']:
        txt(surf,f"P{p['id']+1}",p['x']+16,p['y']-5,GRAY,12,True,True);return
    if p['dash']:
        s2=pygame.Surface((36,48),pygame.SRCALPHA)
        pygame.draw.ellipse(s2,(*GOLD,128),(2,4,32,40));surf.blit(s2,(cx-18,cy-20+bob));return
    if p['inv']>0 and p['inv']<999 and int(p['inv']//80)%2==0:return
    pygame.draw.ellipse(surf,cb,(cx-16,cy-14+bob,32,36))
    pygame.draw.ellipse(surf,BLACK,(cx-16,cy-14+bob,32,36),2)
    pygame.draw.polygon(surf,cc,[(cx-22,cy-8+bob),(cx+22,cy-8+bob),(cx+13,cy-26+bob),(cx-13,cy-26+bob)])
    pygame.draw.polygon(surf,BLACK,[(cx-22,cy-8+bob),(cx+22,cy-8+bob),(cx+13,cy-26+bob),(cx-13,cy-26+bob)],2)
    pygame.draw.rect(surf,GOLD,(cx-22,cy-12+bob,44,5))
    eo=p['face']*3
    for ex in[-6,6]:
        pygame.draw.ellipse(surf,WHITE,(cx+ex+eo-5,cy-6+bob,10,11))
        pygame.draw.ellipse(surf,BLACK,(cx+ex+eo-5,cy-6+bob,10,11),2)
        pygame.draw.circle(surf,BLACK,(cx+ex+eo+p['face']*2,cy+bob),2)
    la=math.sin(p['anim']*0.008)*4 if p['gnd'] else 0
    pygame.draw.rect(surf,RED,(cx-10,p['y']+p['h']-10+bob,8,int(10+la)))
    pygame.draw.rect(surf,RED,(cx+2,p['y']+p['h']-10+bob,8,int(10-la)))
    pygame.draw.rect(surf,DGREY,(cx+p['face']*16-2,cy+12+bob,10*p['face'],4))
    has_crown=False
    for si in range(3):
        if loadout[si]>=0 and loadout[si]<len(WPNS) and WPNS[loadout[si]]['tp']=='crown':
            has_crown=True;break
    if has_crown:
        pygame.draw.polygon(surf,GOLD,[(cx-10,cy-20+bob),(cx-10,cy-26+bob),(cx-6,cy-23+bob),
            (cx,cy-30+bob),(cx+6,cy-23+bob),(cx+10,cy-26+bob),(cx+10,cy-20+bob)])
        pygame.draw.polygon(surf,BLACK,[(cx-10,cy-20+bob),(cx-10,cy-26+bob),(cx-6,cy-23+bob),
            (cx,cy-30+bob),(cx+6,cy-23+bob),(cx+10,cy-26+bob),(cx+10,cy-20+bob)],1)
        # Barba branca
        for bx2 in range(-6,7,3):
            blen=5+abs(bx2)*0.8
            pygame.draw.line(surf,(220,220,220),(cx+bx2,cy+14+bob),(cx+bx2+p['face'],cy+14+int(blen)+bob),1)
    txt(surf,f"P{p['id']+1}",p['x']+16,p['y']-4,GREEN if p['id']==0 else BLUE,9,True,True)
def d_player_shield(surf,p):
    if p.get('shield_timer',0)>0 and p['alive']:
        if p.get('shield_360',False):
            # 360° shield when 1hp
            a=int(60+abs(math.sin(pygame.time.get_ticks()*0.01))*80)
            shield_s=pygame.Surface((56,56),pygame.SRCALPHA)
            pygame.draw.ellipse(shield_s,(70,130,180,a),(0,0,56,56))
            pygame.draw.ellipse(shield_s,(100,200,255,min(255,a+40)),(0,0,56,56),2)
            surf.blit(shield_s,(p['x']+16-28,p['y']+22-28))
        else:
            # Normal frontal shield
            sx=p['x']+(30 if p['face']>0 else -15);sy=p['y']+5
            sw=20;sh=p['h']-10
            a=int(80+abs(math.sin(pygame.time.get_ticks()*0.008))*60)
            s2=pygame.Surface((sw,sh),pygame.SRCALPHA)
            s2.fill((70,130,180,a));surf.blit(s2,(sx,sy))
            pygame.draw.rect(surf,(100,180,240),(sx,sy,sw,sh),2)
# ═══ BULLET SYSTEM ══════════════════════════════════════
pB=[];eB=[];telegraphs=[];spread_groups={};grp_id=0;sched=[]
shuriken_groups={}
mic_visuals=[]
def add_eb(x,y,vx,vy,sz,c,lf,gr=False,hm=False):
    eB.append({'x':x,'y':y,'vx':vx,'vy':vy,'sz':sz,'c':c,'life':lf,'grav':gr,'home':hm})
def add_ring(cx,cy,n,spd,sz,c,lf):
    for i in range(n):a=TAU/n*i;add_eb(cx,cy,math.cos(a)*spd,math.sin(a)*spd,sz,c,lf)
def add_aimed(bx,by,n,spd,spr,sz,c,lf):
    t=tgt_p();ang=math.atan2(t['y']+22-by,t['x']+16-bx)
    if n<2:add_eb(bx,by,math.cos(ang)*spd,math.sin(ang)*spd,sz,c,lf);return
    for i in range(n):a=ang+(i/(n-1)-0.5)*spr;add_eb(bx,by,math.cos(a)*spd,math.sin(a)*spd,sz,c,lf)
def add_wave(bx,by,n,spd,sz,c,lf,delay):
    t=tgt_p();ang=math.atan2(t['y']+22-by,t['x']+16-bx);now=pygame.time.get_ticks()
    for i in range(n):
        def mk(i=i):
            def fn():
                if boss and boss.get('alive'):
                    s2=spd*(1+i*0.2);add_eb(bx,by,math.cos(ang)*s2,math.sin(ang)*s2,sz,c,lf)
            return fn
        sched.append({'time':now+i*delay,'fn':mk()})
def add_rain(n,sz,c,lf):
    for _ in range(n):add_eb(rng(50,W-50),-10,rng(-1,1),rng(3,7),sz,c,lf,True)
def add_tg(x,y,r,d,col,fn):telegraphs.append({'x':x,'y':y,'r':r,'t':0,'dur':d,'col':col,'tp':'circ','cb':fn})
def add_tgR(x,y,w,h,d,col,fn):telegraphs.append({'x':x,'y':y,'w':w,'h':h,'t':0,'dur':d,'col':col,'tp':'rect','cb':fn})

def shoot_p(p):
    global grp_id,piano_variant,piano_laser_active,piano_laser_power
    now=pygame.time.get_ticks()
    tp=WPNS[p['equipped']]['tp'] if p['equipped']<len(WPNS) else 'pea'

    # ── Piano: Laser cancel on release (ANTES do check de shoot) ──
    if tp=='piano' and piano_variant==2 and not p_h(p,'shoot'):
        piano_laser_active=False;piano_laser_power=0
        p['spd']=CFG['pSpd']

    if not p_h(p,'shoot') or not p['alive']:return

    # Rod teleport
    if tp=='rod' and p.get('rod_hook') is not None:
        hook=p['rod_hook']
        p['x']=clamp(hook['x']-16,10,W-42);p['y']=clamp(hook['y']-22,10,GND-44)
        p['inv']=max(p['inv'],2500);p['vy']=0;p['jc']=0
        if boss and boss.get('alive'):
            if dist(p['x']+16,p['y']+22,boss['x']+boss['w']//2,boss['y']+boss['h']//2)<120:hit_boss(35)
        burst(hook['x'],hook['y'],20,CYAN,2,6,3,7,600)
        for b2 in pB[:]:
            if b2.get('ext')=='rod' and b2.get('pid')==p['id']:pB.remove(b2)
        p['rod_hook']=None;p['lsht']=now;return

    widx=p['equipped']
    rate=CFG['wR'][widx] if widx<len(CFG['wR']) else 300
    # Piano notes: faster rate
    if tp=='piano' and piano_variant==1:rate=120
    # Piano laser: no rate limit (continuous)
    if tp=='piano' and piano_variant==2:rate=0
    if now-p['lsht']<rate:return
    p['lsht']=now;cx=p['x']+16+p['face']*18;cy=p['y']+p['h']*0.35

    def mk(vx,vy):
        return{'x':cx,'y':cy,'vx':vx,'vy':vy,'ext':tp,'life':3000,'sx':cx,
            'ret':False,'expl':False,'ang':0,'hitC':0,'hitCD':0,'elap':0,
            'gid':0,'hit':False,'pid':p['id']}

    # ══════════════════════════════════
    # PIANO — 3 variantes
    # ══════════════════════════════════
    if tp=='piano':
        if piano_variant==0:
            if sum(1 for b2 in pB if b2.get('ext')=='piano_throw')<1:
                b=mk(p['face']*10,0);b['ext']='piano_throw';b['life']=2000
                pB.append(b)
        elif piano_variant==1:
            ...
            # V2: Musical notes — random status, high cadence
            b=mk(p['face']*9,rng(-2,2))
            b['ext']='piano_note';b['life']=1500
            b['note_status']=random.choice(['burn','poison','frio','bleed','picancia'])
            pB.append(b)
        elif piano_variant==2:
            # V3: Rainbow laser — continuous, grows
            piano_laser_active=True
            piano_laser_power=min(piano_laser_power+dt_global*0.003,3.0)
            laser_w=int(4+piano_laser_power*8)
            laser_dmg=max(1,int(piano_laser_power*2))
            # Slow player while charging
            p['spd']=max(1,CFG['pSpd']-piano_laser_power*1.5)
            # Deal damage continuously to boss
            if boss and boss.get('alive'):
                boss_cx=boss['x']+boss['w']//2;boss_cy=boss['y']+boss['h']//2
                if (p['face']>0 and boss_cx>cx) or (p['face']<0 and boss_cx<cx):
                    hit_boss(laser_dmg)
                    burst(boss_cx,boss_cy,3,random.choice([RED,YELLOW,GREEN,CYAN,PURPLE]),1,3,2,4,150)
                    global special_charge
                    special_charge=min(100,special_charge+0.15)
            return  # don't create projectile

    # ══════════════════════════════════
    # ALL OTHER WEAPONS (same as before)
    # ══════════════════════════════════
    elif tp=='pea':pB.append(mk(p['face']*7,0))
    elif tp=='boom':b=mk(p['face']*7,0);b['life']=5000;pB.append(b)
    elif tp=='tomato':
        has_synergy=any(loadout[i]>=0 and loadout[i]<len(WPNS) and WPNS[loadout[i]]['tp'] in('mask','mic') for i in range(3))
        if has_synergy:
            b=mk(p['face']*6,-5);b['ext']='tomato_champ';b['life']=4000;b['landed']=False;pB.append(b)
        else:
            b=mk(p['face']*5,-4);b['life']=4000;b['landed']=False;pB.append(b)
    elif tp=='mask':b=mk(p['face']*3.5,0);b['life']=6000;pB.append(b)
    elif tp=='shuriken':
        count=p.get('shuriken_count',1);grp_id+=1;gid=grp_id
        shuriken_groups[gid]={'hits':0,'fired':count,'dead':0,'hit_all':True,'pid':p['id']}
        for i in range(count):
            offset_y=(i-(count-1)/2)*8
            b=mk(p['face']*7,0);b['y']=cy+offset_y;b['gid']=gid;b['life']=2500;pB.append(b)
    elif tp=='mic':
        if boss and boss.get('alive'):
            in_c,d=in_cone(cx,cy,p['face'],boss['x']+boss['w']//2,boss['y']+boss['h']//2,70,300)
            if in_c:
                dmg=max(3,int(12*(1-d/300)));hit_boss(dmg)
                burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,10,(200,100,255),2,5,3,6,400)
                st=boss.get('status',{})
                if st.get('collapsed',False):_trigger_trauma()
                st['irritated']=True;st['irrit_time']=max(st.get('irrit_time',0),15000)
                st['mic_irrit']=True;st['mic_timer']=700
        mic_visuals.append({'x':cx,'y':cy,'face':p['face'],'t':0,'dur':300})
    elif tp=='pepper':
        pepper_count=sum(1 for b2 in pB if b2.get('ext')=='pepper')
        if pepper_count<6:b=mk(p['face']*2.5,0);b['life']=5000;pB.append(b)
    elif tp=='camera':
        if boss and boss.get('alive'):
            st=boss.get('status',{})
            if not st.get('filming',False):
                st['filming']=True;st['film_time']=5000;st['film_dmg']=0;st['film_hit_player']=False
                burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,15,(100,200,255),2,5,3,6,500)
    elif tp=='nail':b=mk(p['face']*4,0);b['life']=4000;pB.append(b)
    elif tp=='shield':
        if p.get('shield_timer',0)<=0:
            dur=2000 if p['hp']<=1 else 4000
            p['shield_timer']=dur;p['shield_360']=p['hp']<=1
        if p.get('dash',False) and boss and boss.get('alive'):
            if dist(p['x']+16,p['y']+22,boss['x']+boss['w']//2,boss['y']+boss['h']//2)<80:
                missing=(p['mhp']-p['hp'])/max(p['mhp'],1)
                hit_boss(int(15+missing*30))
                burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,20,(70,130,180),2,6,3,7,500)
    elif tp=='rod':
        has_hook=any(b2.get('ext')=='rod' and b2.get('pid')==p['id'] for b2 in pB)
        if not has_hook:
            b=mk(p['face']*10,0);b['ext']='rod';b['life']=3000;b['hooked']=False;pB.append(b)
    elif tp=='crown':
        for i in range(3):
            b=mk(p['face']*(5+i*1.5),rng(-0.8,0.8));b['life']=3000;b['hit_count']=0;pB.append(b)
    elif tp=='slots':b=mk(p['face']*5,0);b['life']=4000;pB.append(b)
    elif tp=='spr':
        grp_id+=1;spread_groups[grp_id]={'t':now,'hits':[],'done':False}
        for vy in[-2.1,0,2.1]:b=mk(p['face']*7,vy);b['gid']=grp_id;pB.append(b)
    elif tp=='bolt':pB.append(mk(p['face']*14,0))
    elif tp=='bomb':b=mk(p['face']*4,-2);b['life']=4000;pB.append(b)
    elif tp=='firering':
        for b2 in pB[:]:
            if b2.get('ext')=='firering' and b2.get('owner_id')==p['id']:pB.remove(b2)
        for ring_idx in range(2):
            for i in range(3):
                base_ang=ring_idx*(TAU/6);ang=base_ang+i*(TAU/3)
                radius=80 if ring_idx==0 else 50
                cx2=p['x']+16+math.cos(ang)*radius;cy2=p['y']+22+math.sin(ang)*radius
                pB.append({'x':cx2,'y':cy2,'vx':0,'vy':0,'ext':'firering','life':6000,
                    'ang':ang,'radius':radius,'hit_boss_cd':0,'pid':p['id'],
                    'owner_id':p['id'],'dmg':3,'elap':0,'sx':cx,'ret':False,
                    'expl':False,'hitC':0,'hitCD':0,'gid':0,'hit':False})
    elif tp=='home':pB.append(mk(p['face']*5,0))
    elif tp=='matchbox':
        b=mk(p['face']*3,-2);b['life']=12000;b['landed']=False;b['apply_tick']=500;pB.append(b)
    elif tp=='blood':
        if sum(1 for b2 in pB if b2.get('ext')=='blood')<3:pB.append(mk(p['face']*4,0))

def hit_p(p):
    global fDmg,shake
    if p['inv']>0 or p['dash'] or not p['alive']:return
    p['hp']-=1;p['inv']=CFG['pInv'];fDmg+=1;shake=max(shake,12)
    if boss and boss.get('status',{}).get('filming',False):boss['status']['film_hit_player']=True
    burst(p['x']+16,p['y']+22,10,RED,2,5,2,4,400)
    if p['hp']<=0:
        p['alive']=False;p['deadT']=0
        burst(p['x']+16,p['y']+22,20,GRAY,2,6,3,6,600)
        if all_de():sched.append({'time':pygame.time.get_ticks()+400,'fn':lambda:go_st('over')})

def tgt_p():
    if boss:return near_p(boss['x']+boss['w']/2,boss['y']+boss['h']/2) or players[0]
    return players[0] if players else{'x':120,'y':GND-44,'w':32,'h':44,'face':1,'spd':5,'gnd':True,'vy':0}

def u_bullets(dt):
    global shake,special_charge
    now=pygame.time.get_ticks()
    for b in pB[:]:
        b['life']-=dt;b['elap']=b.get('elap',0)+dt
        if b.get('hitCD',0)>0:b['hitCD']-=dt
        if b.get('hit_boss_cd',0)>0:b['hit_boss_cd']-=dt

        # ══ SPECIAL: FIRERING ══
        if b['ext']=='firering':
            owner=players[b['owner_id']] if b['owner_id']<len(players) else None
            if owner and owner['alive']:
                b['ang']+=0.08
                b['x']=owner['x']+16+math.cos(b['ang'])*b['radius']
                b['y']=owner['y']+22+math.sin(b['ang'])*b['radius']
            else:b['life']=0
            if boss and boss.get('alive') and b.get('hit_boss_cd',0)<=0:
                if hit_cr(b['x'],b['y'],12,boss['x'],boss['y'],boss['w'],boss['h']):
                    b['hit_boss_cd']=200;apply_burn(2000);hit_boss(b['dmg']+1)
                    burst(b['x'],b['y'],8,ORANGE,1,3,2,4,200)
            if b['life']<=0 and b in pB:pB.remove(b)
            continue

        # ══ SPECIAL: MATCHBOX ══
        if b['ext']=='matchbox':
            if not b.get('landed',False):
                b['vy']+=0.3;b['x']+=b['vx'];b['y']+=b['vy']
                if b['y']>=GND-15:b['y']=GND-15;b['vy']=0;b['vx']=0;b['landed']=True
            if b.get('landed',False):
                b['apply_tick']-=dt
                if boss and boss.get('alive') and dist(b['x'],b['y'],boss['x']+boss['w']//2,boss['y']+boss['h'])<70:
                    if b['apply_tick']<=0:b['apply_tick']=1000;apply_poison(24000);apply_hemorrhage(10000);hit_boss(1)
            if b['life']<=0 and b in pB:pB.remove(b)
            continue

        # ══ SPECIAL: ROD ══
        if b['ext']=='rod':
            if b.get('hooked',False):
                if b['life']<=0:
                    pr=players[b['pid']] if b['pid']<len(players) else None
                    if pr and pr.get('rod_hook'):pr['rod_hook']=None
                    if b in pB:pB.remove(b)
                continue
            b['x']+=b['vx'];b['y']+=b['vy']
            if boss and boss.get('alive') and hit_cr(b['x'],b['y'],10,boss['x'],boss['y'],boss['w'],boss['h']):
                b['hooked']=True;b['vx']=0;b['vy']=0;hit_boss(2)
                burst(b['x'],b['y'],5,CYAN,1,3,2,4,200)
                pr=players[b['pid']] if b['pid']<len(players) else None
                if pr:pr['rod_hook']={'x':b['x'],'y':b['y']}
            if abs(b['x']-b['sx'])>350 and not b.get('hooked',False):
                b['hooked']=True;b['vx']=0;b['vy']=0
                pr=players[b['pid']] if b['pid']<len(players) else None
                if pr:pr['rod_hook']={'x':b['x'],'y':b['y']}
            if b['life']<=0:
                pr=players[b['pid']] if b['pid']<len(players) else None
                if pr and pr.get('rod_hook'):pr['rod_hook']=None
                if b in pB:pB.remove(b)
            continue

        # ══ SPECIAL: TOMATO / TOMATO_AUD ══
        if b['ext'] in('tomato','tomato_aud'):
            b['vy']+=0.14;b['x']+=b['vx'];b['y']+=b['vy']
            if b['y']>=GND-10 and not b.get('landed',False):
                b['landed']=True
                burst(b['x'],GND,15,(220,20,60),2,5,3,6,400);shake=max(shake,5)
                if boss and boss.get('alive') and dist(b['x'],GND,boss['x']+boss['w']//2,boss['y']+boss['h'])<80:
                    hit_boss(3)
                    if b['ext']=='tomato' and boss:
                        st=boss.get('status',{})
                        st['irritated']=True;st['irrit_time']=max(st.get('irrit_time',0),8000)
                        st['tomato_hits']=st.get('tomato_hits',0)+1
                        if st['tomato_hits']>=2:
                            st['tomato_hits']=0;side=random.choice([-1,1])
                            sx=-10 if side==-1 else W+10;vx=side*rng(3.5,5)
                            pB.append({'x':sx,'y':rng(80,150),'vx':vx,'vy':rng(-4,-2),
                                'ext':'tomato_aud','life':5000,'pid':0,'elap':0,'sx':sx,
                                'ret':False,'expl':False,'hitC':0,'hitCD':0,'gid':0,'hit':False,'landed':False})
                b['life']=0
            if b['life']<=0 and b in pB:pB.remove(b)
            continue
        if b['ext']=='tomato_champ':
            b['vy']+=0.14;b['x']+=b['vx'];b['y']+=b['vy']
            if b['y']>=GND-10 and not b.get('landed',False):
                b['landed']=True
                burst(b['x'],GND,15,(255,215,0),2,5,3,6,400)
                if boss and boss.get('alive') and dist(b['x'],GND,boss['x']+boss['w']//2,boss['y']+boss['h'])<80:
                    hit_boss(5)
                    st=boss.get('status',{})
                    if st.get('mask_loucura',0)>0 or st.get('mask_attached',False):
                        _trigger_collapse()
                b['life']=0
            if b['life']<=0 and b in pB:pB.remove(b)
            continue

        # ══ SPECIAL: SHIELD REFLECT ══
        if b['ext']=='shield_reflect':
            if boss and boss.get('alive'):
                dx=boss['x']+boss['w']/2-b['x'];dy=boss['y']+boss['h']/2-b['y'];d=math.hypot(dx,dy) or 1
                b['vx']+=(dx/d)*0.5;b['vy']+=(dy/d)*0.5;s2=math.hypot(b['vx'],b['vy'])
                if s2>8:b['vx']=b['vx']/s2*8;b['vy']=b['vy']/s2*8
            b['x']+=b['vx'];b['y']+=b['vy'];b['x']=wrap_bx(b['x'])
            if boss and boss.get('alive'):
                did=False;bxs=[b['x']]
                if b['x']<25:bxs.append(b['x']+W)
                if b['x']>W-25:bxs.append(b['x']-W)
                for bx2 in bxs:
                    if did:break
                    if hit_cr(bx2,b['y'],12,boss['x'],boss['y'],boss['w'],boss['h']):
                        did=True;hit_boss(b.get('ref_dmg',3))
                        burst(b['x'],b['y'],8,(70,130,180),1,4,2,5,300);b['life']=0
            if b['life']<=0 and b in pB:pB.remove(b)
            continue

        # ══ STANDARD MOVEMENT ══
        if b['ext']=='boom':
            if not b['ret'] and(abs(b['x']-b['sx'])>250 or b['x']<-20 or b['x']>W+20):b['ret']=True
            if b['ret']:
                pr=players[b['pid']] if b['pid']<len(players) else players[0]
                dx=pr['x']+16-b['x'];dy=pr['y']+20-b['y'];d=math.hypot(dx,dy) or 1
                b['vx']+=(dx/d*7-b['vx'])*0.08;b['vy']+=(dy/d*7-b['vy'])*0.08
                s2=math.hypot(b['vx'],b['vy'])
                if s2>9:b['vx']=b['vx']/s2*9;b['vy']=b['vy']/s2*9
        if b['ext']=='home' and boss and boss.get('alive'):
            sm=1+b['elap']*0.0015
            dx=boss['x']+boss['w']/2-b['x'];dy=boss['y']+boss['h']/2-b['y'];d=math.hypot(dx,dy) or 1
            b['vx']+=(dx/d)*0.35*sm;b['vy']+=(dy/d)*0.35*sm;s2=math.hypot(b['vx'],b['vy']);mx=5*sm
            if s2>mx:b['vx']=b['vx']/s2*mx;b['vy']=b['vy']/s2*mx
        if b['ext']=='bomb':b['vy']+=0.14
        b['x']+=b['vx'];b['y']+=b['vy'];b['x']=wrap_bx(b['x'])

        # ══ BOMB GROUND ══
        if b['ext']=='bomb' and b['y']+10>=GND and not b.get('expl',False):
            b['expl']=True;burst(b['x'],GND,20,ORANGE,2,7,3,7,500);shake=max(shake,10)
            if boss and boss.get('alive') and dist(...) <120:hit_boss(15)
            b['life']=0

        # ══ BOSS COLLISION ══
        if boss and boss.get('alive') and not b.get('expl',False):
            if b['ext'] in('shield_reflect','tomato_champ'):continue
            did=False;bxs=[b['x']]
            if b['x']<25:bxs.append(b['x']+W)
            if b['x']>W-25:bxs.append(b['x']-W)
            for bx2 in bxs:
                if did:break
                if hit_cr(bx2,b['y'],12,boss['x'],boss['y'],boss['w'],boss['h']):
                    did=True;dmg=W_DMG.get(b['ext'],1)
                    if b['ext']=='boom':dmg=2+int(b['elap']/500)
                    elif b['ext']=='mask':
                        st=boss.get('status',{})
                        if st.get('mask_attached',False):
                            loucura=st.get('mask_loucura',0);dmg=max(1,loucura*8)
                            st['mask_attached']=False;st['mask_loucura']=0
                            burst(boss['x']+boss['w']//2,boss['y']-10,20,(180,180,200),2,6,3,7,500)
                        else:
                            st['mask_attached']=True;st['mask_loucura']=0;st['mask_tick']=1500
                            burst(boss['x']+boss['w']//2,boss['y']-10,10,(180,180,200),1,4,2,5,300);dmg=0
                            burst(boss['x']+boss['w']//2,boss['y']-10,10,(180,180,200),1,4,2,5,300);dmg=0
                    elif b['ext']=='shuriken':
                        dmg=W_DMG.get('shuriken',1);b['hit']=True
                        if random.random()<0.5:
                            pr=players[b['pid']] if b['pid']<len(players) else None
                            if pr:pr['shuriken_count']=min(pr.get('shuriken_count',1)+1,8)
                    elif b['ext']=='pepper':dmg=W_DMG.get('pepper',1);apply_picancia(1)
                    elif b['ext']=='nail':
                        st=boss.get('status',{});stacks=st.get('nail_stacks',0)
                        dmg=1+stacks;st['nail_stacks']=stacks+1
                    elif b['ext']=='crown':
                        hc=b.get('hit_count',0)
                        dmg=W_DMG.get('crown',2)
                        if hc%3==0:apply_frio(1)
                        b['hit_count']=hc+1
                    elif b['ext']=='slots':
                        _apply_slot(random.randint(0,len(SLOT_RESULTS)-1));dmg=0   
                    elif b['ext']=='spr':
                        if not b['hit']:
                            b['hit']=True;g=spread_groups.get(b['gid'])
                            if g and not g['done']:g['hits'].append(1)
                            if g and len(g['hits'])>=3:g['done']=True;dmg=12
                            else:dmg=0
                        else:dmg=0
                    elif b['ext']=='bolt':
                        if b['hitCD']<=0:b['hitC']+=1;dmg=W_DMG.get('bolt',1);b['hitCD']=250
                        else:dmg=0
                        if b['hitC']>=2:b['life']=0
                    elif b['ext']=='blood':
                        dmg=W_DMG.get('blood',4)
                        if random.random()<0.33:apply_bleed(15000)
                    elif b['ext']=='pea':dmg=W_DMG.get('pea',1)
                    elif b['ext']=='piano_throw':
                        dmg=int(W_DMG.get('piano_throw',12)*piano_dmg_mult())
                        if random.random()<0.1:
                            boss['_stun_time']=800
                            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,10,(200,0,0),2,5,3,6,400)
                    elif b['ext']=='piano_note':
                        dmg=int(W_DMG.get('piano_note',2)*piano_dmg_mult())
                        ns=b.get('note_status','burn')
                        st=boss.get('status',{})
                        if ns=='burn':apply_burn(2000)
                        elif ns=='poison':apply_poison(5000)
                        elif ns=='frio':apply_frio(1)
                        elif ns=='bleed':apply_bleed(3000)
                        elif ns=='picancia':apply_picancia(1)
                    elif b['ext']=='pea':dmg=W_DMG.get('pea',1)
                    if dmg>0:
                        if b['ext']!='pea':dmg+=medal_bonus()
                        hit_boss(dmg)
                        if has_secret():
                            special_charge=min(100,special_charge+max(0.5,dmg*0.2))
                    c2=WPNS[players[b['pid']]['equipped'] if b['pid']<len(players) else 0]['c']
                    burst(b['x'],b['y'],5,c2,1,3,2,4,250);b['life']=0

        # ══ REMOVAL ══
        if b['life']<=0 or b['y']<-60 or b['y']>H+60:
            if b['ext']=='shuriken' and b.get('gid'):
                g=shuriken_groups.get(b['gid'])
                if g:
                    g['dead']+=1
                    if b.get('hit'):g['hits']+=1
                    else:g['hit_all']=False
                    if g['dead']>=g['fired']:
                        pid=g['pid']
                        if pid<len(players):players[pid]['shuriken_count']=min(g['fired']+1,8) if g['hit_all'] else 1
                        if b['gid'] in shuriken_groups:del shuriken_groups[b['gid']]
            if b in pB:pB.remove(b)

    # ══ SPREAD CLEANUP ══
    for gid in list(spread_groups.keys()):
        g=spread_groups[gid]
        if not g['done'] and now-g['t']>500:
            g['done']=True
            if g['hits']:hit_boss(min(len(g['hits']),3)*4)
        if g['done'] and now-g['t']>2000:del spread_groups[gid]

    # ══ ENEMY BULLETS ══
    for b in eB[:]:
        b['life']-=dt
        if b.get('grav'):b['vy']+=0.1
        if b.get('home'):
            tgt=near_p(b['x'],b['y'])
            if tgt:
                dx=tgt['x']+16-b['x'];dy=tgt['y']+22-b['y'];d=math.hypot(dx,dy) or 1
                b['vx']+=(dx/d)*0.12;b['vy']+=(dy/d)*0.12;s2=math.hypot(b['vx'],b['vy'])
                if s2>4.5:b['vx']=b['vx']/s2*4.5;b['vy']=b['vy']/s2*4.5
        if not b.get('frio_applied',False) and boss and boss.get('status',{}).get('frio_stacks',0)>0:
            frio=boss['status']['frio_stacks'];mult=max(0.75,1-frio*0.025)
            b['vx']*=mult;b['vy']*=mult;b['frio_applied']=True
        b['x']+=b['vx'];b['y']+=b['vy']
        reflected=False
        for p in players:
            if not p['alive'] or p.get('shield_timer',0)<=0:continue
            if p.get('shield_360',False):
                # 360° — check circle around player
                hit_area=hit_cr(b['x'],b['y'],b['sz']+5,p['x']+16,p['y']+22,0,0)
                check=lambda:math.hypot(b['x']-(p['x']+16),b['y']-(p['y']+22))<28+b['sz']
                if not check():continue
            else:
                sx=p['x']+(30 if p['face']>0 else -15);sy=p['y']+5;sw=20;sh2=p['h']-10
                if not hit_cr(b['x'],b['y'],b['sz']+5,sx,sy,sw,sh2):continue
            missing=(p['mhp']-p['hp'])/max(p['mhp'],1);ref_dmg=int(8+missing*20)
            pB.append({'x':b['x'],'y':b['y'],'vx':0,'vy':0,'ext':'shield_reflect',
                'life':3000,'sx':b['x'],'ret':False,'expl':False,'ang':0,'hitC':0,
                'hitCD':0,'elap':0,'gid':0,'hit':False,'pid':p['id'],'ref_dmg':ref_dmg})
            burst(b['x'],b['y'],8,(70,130,180),1,4,2,5,300);reflected=True;break
        if reflected:eB.remove(b);continue
        hit=False
        for p in players:
            if not p['alive']:continue
            if hit_cr(b['x'],b['y'],b['sz']+2,p['x'],p['y'],p['w'],p['h']):hit_p(p);hit=True;break
        if hit:eB.remove(b);continue
        if b['life']<=0 or b['y']>H+40:eB.remove(b)

def d_bullets(surf):
    for b in pB:
        c=WPNS[players[b['pid']]['equipped'] if b['pid']<len(players) else 0]['c']
        bx,by=int(b['x']),int(b['y'])
        if b['ext']=='firering':
            pygame.draw.circle(surf,ORANGE,(bx,by),8)
            pygame.draw.circle(surf,YELLOW,(bx,by),4)
            pygame.draw.circle(surf,RED,(bx,by),8,1)
        elif b['ext']=='piano_throw':
            # Piano vermelho voador
            pygame.draw.rect(surf,(180,0,0),(bx-12,by-8,24,16))
            pygame.draw.rect(surf,BLACK,(bx-12,by-8,24,16),2)
            # Teclas
            for ki in range(5):
                pygame.draw.rect(surf,WHITE if ki%2==0 else BLACK,(bx-10+ki*4,by-5,3,10))
            # Brilho
            pulse=int(abs(math.sin(pygame.time.get_ticks()*0.01))*40)+20
            glow=pygame.Surface((30,22),pygame.SRCALPHA)
            pygame.draw.ellipse(glow,(200,0,0,pulse),(0,0,30,22))
            surf.blit(glow,(bx-15,by-11))

        elif b['ext']=='piano_note':
            nc={'burn':ORANGE,'poison':(0,180,0),'frio':CYAN,'bleed':RED,'picancia':(200,50,0)}
            c2=nc.get(b.get('note_status','burn'),WHITE)
            # Nota musical
            pygame.draw.ellipse(surf,c2,(bx-4,by-2,8,6))
            pygame.draw.rect(surf,c2,(bx+3,by-14,2,14))
            pygame.draw.ellipse(surf,c2,(bx+3,by-16,6,4))
            pygame.draw.ellipse(surf,BLACK,(bx-4,by-2,8,6),1)
        elif b['ext']=='boom':
            ca,sa=math.cos(b.get('ang',0)),math.sin(b.get('ang',0));rp=[]
            for px2,py2 in[(0,-4),(8,0),(0,4),(-8,0)]:rp.append((b['x']+px2*ca-py2*sa,b['y']+px2*sa+py2*ca))
            pygame.draw.polygon(surf,c,rp);pygame.draw.polygon(surf,BLACK,rp,1)
        elif b['ext']=='bomb':b['expl']=True;dmg=W_DMG.get('bomb',5)
        elif b['ext']=='mask':
            pygame.draw.ellipse(surf,(180,180,200),(bx-8,by-10,16,20))
            pygame.draw.ellipse(surf,BLACK,(bx-8,by-10,16,20),1)
            pygame.draw.line(surf,BLACK,(bx-4,by-2),(bx-4,by+2),2)
            pygame.draw.line(surf,BLACK,(bx+4,by-2),(bx+4,by+2),2)
        elif b['ext']=='shuriken':
            ca=math.cos(b.get('ang',0)+b['elap']*0.015)
            sa=math.sin(b.get('ang',0)+b['elap']*0.015)
            pts=[]
            for i in range(4):
                a=TAU/4*i;pts.append((bx+int(ca*math.cos(a)*7-sa*math.sin(a)*7),by+int(sa*math.cos(a)*7+ca*math.sin(a)*7)))
            pygame.draw.polygon(surf,(192,192,192),pts);pygame.draw.polygon(surf,BLACK,pts,1)
        elif b['ext']=='pepper':
            pygame.draw.ellipse(surf,(200,0,0),(bx-5,by-7,10,14))
            pygame.draw.ellipse(surf,BLACK,(bx-5,by-7,10,14),1)
            pygame.draw.line(surf,(30,150,30),(bx,by-7),(bx+2,by-11),2)
        elif b['ext']=='crown':
            ca=math.cos(b.get('ang',0)+b['elap']*0.02)
            sa=math.sin(b.get('ang',0)+b['elap']*0.02)
            pts=[]
            for i in range(5):
                a=TAU/5*i
                r2=7 if i%2==0 else 4
                pts.append((bx+int(ca*math.cos(a)*r2-sa*math.sin(a)*r2),
                            by+int(sa*math.cos(a)*r2+ca*math.sin(a)*r2)))
            pygame.draw.polygon(surf,(150,220,255),pts)
            pygame.draw.polygon(surf,BLACK,pts,1)
            pygame.draw.circle(surf,WHITE,(bx,by),2)
        elif b['ext']=='slots':
            pygame.draw.rect(surf,(200,0,100),(bx-8,by-6,16,12))
            pygame.draw.rect(surf,BLACK,(bx-8,by-6,16,12),1)
            for i in range(3):
                pygame.draw.rect(surf,WHITE,(bx-6+i*5,by-4,4,8))
            flicker=int(pygame.time.get_ticks()/100)%3
            pygame.draw.rect(surf,(255,255,0),(bx-6+flicker*5,by-4,4,8))
        elif b['ext']=='nail':
            fc=1
            if b['pid']<len(players):fc=players[b['pid']]['face']
            pygame.draw.line(surf,(100,60,20),(bx-6,by),(bx+6,by),2)
            pygame.draw.circle(surf,(160,82,45),(bx+fc*6,by),3)
            pygame.draw.circle(surf,BLACK,(bx,by),3,1)
            stacks=boss['status'].get('nail_stacks',0) if boss else 0
            if stacks>0:txt(surf,str(stacks),bx,by-16,(160,82,45),9,True,True)
        elif b['ext']=='blood':
            pulse=int(abs(math.sin(pygame.time.get_ticks()*0.01))*4)
            pygame.draw.circle(surf,(139,0,0),(bx,by),9)
            pygame.draw.circle(surf,(200,0,0),(bx,by),5+pulse)
            pygame.draw.circle(surf,BLACK,(bx,by),9,1)
        elif b['ext']=='matchbox':
            pygame.draw.rect(surf,(255,193,7),(bx-8,by-5,16,10))
            pygame.draw.rect(surf,BLACK,(bx-8,by-5,16,10),1)
            pygame.draw.line(surf,(180,130,30),(bx+6,by-5),(bx+12,by-12),2)
            pygame.draw.circle(surf,(255,80,0),(bx+12,by-13),2)
            if boss and boss.get('alive') and dist(bx,by,boss['x']+boss['w']//2,boss['y']+boss['h'])<70:
                pygame.draw.circle(surf,(0,200,0),(bx,by),20,1)
        elif b['ext']=='rod':
            if b.get('hooked',False):
                pygame.draw.circle(surf,(0,150,136),(bx,by),5)
                pygame.draw.line(surf,(100,100,100),(bx,by),(bx-3,by-8),2)
                txt(surf,"Press J",bx,by-16,YELLOW,8,True,True)
            else:
                pygame.draw.circle(surf,(0,200,180),(bx,by),4)
                pygame.draw.line(surf,(0,150,136),(bx-int(b['vx']*2),by),(bx,by),2)
        elif b['ext'] in('tomato','tomato_aud'):
            tc=(220,20,60) if b['ext']=='tomato' else(180,10,40)
            pygame.draw.circle(surf,tc,(bx,by),7)
            pygame.draw.circle(surf,(50,150,50),(bx,by-5),3)
            pygame.draw.circle(surf,BLACK,(bx,by),7,1)
        elif b['ext']=='shield_reflect':
            pygame.draw.circle(surf,(100,200,255),(bx,by),6)
            pygame.draw.circle(surf,WHITE,(bx,by),3)
            pygame.draw.circle(surf,BLACK,(bx,by),6,1)
        elif b['ext']=='home':
            pygame.draw.circle(surf,c,(bx,by),5)
            pygame.draw.circle(surf,BLACK,(bx,by),5,1)
        else:
            pygame.draw.circle(surf,c,(bx,by),4)
            pygame.draw.circle(surf,BLACK,(bx,by),4,1)

    # ── Microfone visual ──
    for mv in mic_visuals:
        prog=mv['t']/mv['dur'];a=max(0,int(200*(1-prog)))
        s2=pygame.Surface((W,H),pygame.SRCALPHA)
        cx,cy=mv['x'],mv['y'];f=mv['face']
        for i in range(3):
            w2=40+i*40;h2=20+i*20
            ox=cx+f*(20+i*15)
            pygame.draw.ellipse(s2,(200,100,255,max(0,a-i*40)),(ox-w2//2,cy-h2//2,w2,h2))
        surf.blit(s2,(0,0))

    # ── Enemy bullets ──
    for b in eB:
        sz=int(b['sz']);pygame.draw.circle(surf,b['c'],(int(b['x']),int(b['y'])),sz)
        pygame.draw.circle(surf,BLACK,(int(b['x']),int(b['y'])),sz,2)

def d_piano_passive_hud(surf):
    """Mostra efeito passivo ativo do piano"""
    if not has_secret():return
    if piano_passive_effect and piano_passive_dur>0:
        eff=piano_passive_effect
        prog=piano_passive_dur/eff['dur']
        # Barra no canto superior direito
        bw=120;bh=14;bx=W-bw-10;by=60
        pygame.draw.rect(surf,(20,20,40),(bx-2,by-2,bw+4,bh+4))
        pygame.draw.rect(surf,eff['c'],(bx,by,int(bw*prog),bh))
        pygame.draw.rect(surf,eff['c'],(bx-2,by-2,bw+4,bh+4),1)
        txt(surf,eff['n'],bx+bw//2,by-2,eff['c'],8,True,True)
    # Timer da proxima passiva
    if not(piano_passive_effect and piano_passive_dur>0):
        remaining=max(0,5000-piano_passive_timer)/1000
        txt(surf,f"Passiva: {remaining:.1f}s",W-10,60,GRAY,8,True,right=True)

def d_special_bar(surf):
    """Barra de especial do piano"""
    if not has_secret():return
    bw=200;bh=12;bx=W//2-bw//2;by=H-38
    pygame.draw.rect(surf,(20,20,40),(bx-2,by-2,bw+4,bh+4))
    # Gradiente vermelho→dourado
    fill_w=int(bw*special_charge/100)
    if fill_w>0:
        pygame.draw.rect(surf,(200,0,0),(bx,by,fill_w,bh))
        if special_charge>=80:
            pygame.draw.rect(surf,(255,215,0),(bx,by,fill_w,bh))
    pygame.draw.rect(surf,(200,0,0) if special_charge<100 else GOLD,(bx-2,by-2,bw+4,bh+4),2)
    txt(surf,f"ESPECIAL {int(special_charge)}%",bx+bw//2,by-2,WHITE if special_charge<100 else GOLD,8,True,True)
    if special_charge>=100:
        if(pygame.time.get_ticks()//400)%2:txt(surf,"[U] DESEJO",bx+bw//2,by+14,GOLD,9,True,True)

def d_piano_variant_hud(surf):
    """Mostra variante ativa do piano"""
    if not has_secret():return
    p=players[0] if players else None
    if not p or p['equipped']>=len(WPNS) or WPNS[p['equipped']]['tp']!='piano':return
    variants=["PIANO","NOTAS","LASER"]
    colors=[RED,(200,100,255),(255,100,100)]
    for i in range(3):
        x=10+i*70;y=H-52
        sel=(i==piano_variant)
        c2=colors[i] if sel else(60,60,60)
        pygame.draw.rect(surf,c2,(x,y,62,16),2 if sel else 1)
        if sel:pygame.draw.rect(surf,(*colors[i],40),(x+1,y+1,60,14))
        txt(surf,f"[{i+1}] {variants[i]}",x+31,y+1,colors[i] if sel else(100,100,100),7,True,True)

def d_wish_thunder(surf):
    """Desenha raios do desejo Relâmpago"""
    if not wish_thunder_pts:return
    for tp2 in wish_thunder_pts:
        if tp2['t']<0 or tp2['t']>2000:continue
        # Lightning bolt from top
        x=tp2['x'];y=0
        segments=[]
        for seg in range(8):
            nx=x+random.randint(-15,15);ny=y+GND//8
            segments.append((x,y,nx,ny));x=nx;y=ny
        for sx1,sy1,sx2,sy2 in segments:
            pygame.draw.line(surf,YELLOW,(sx1,sy1),(sx2,sy2),3)
            pygame.draw.line(surf,WHITE,(sx1,sy1),(sx2,sy2),1)

def d_piano_laser(surf,p):
    """Desenha o laser arco-iris"""
    if not piano_laser_active or not p['alive']:return
    cx=p['x']+16+p['face']*18;cy=p['y']+p['h']*0.35
    laser_w=int(4+piano_laser_power*8)
    # Rainbow colors
    t=pygame.time.get_ticks()
    colors=[RED,ORANGE,YELLOW,GREEN,CYAN,PURPLE,(200,100,255)]
    for i in range(3):
        c2=colors[(t//50+i)%len(colors)]
        w2=max(1,laser_w-i*2)
        end_x=cx+p['face']*W
        pygame.draw.line(surf,c2,(cx,cy),(end_x,cy+random.randint(-2,2)),w2)
    # Glow
    glow=pygame.Surface((40,laser_w*2),pygame.SRCALPHA)
    pygame.draw.ellipse(glow,(255,255,255,40),(0,0,40,laser_w*2))
    surf.blit(glow,(cx-20,cy-laser_w))
# ═══ BOSS SYSTEM ════════════════════════════════════════
boss=None;b_atk={'st':'idle','t':0,'id':-1}
ph_tr={'st':'none','t':0};b_anim=0
state='title';fDmg=0;fTime=0;shake=0;fadeA=0;rN=0

def init_boss(idx):
    global boss,b_atk,ph_tr,b_anim
    d=BDATA[idx];hp_m=1.8 if num_players>=2 else 1;ai_b=2 if num_players>=2 else 0
    total_hp=round(d['hp']*d['ph']*hp_m)
    boss={'n':d['n'],'mhp':total_hp,'hp':total_hp,
        'x':W-180,'y':GND-d['h'],'w':d['w'],'h':d['h'],'alive':True,'idx':idx,
        'tx':W-180,'ty':GND-d['h'],'ms':2,'fl':0,'phase':0,'maxPh':d['ph']-1,'ai':d['ai']+ai_b,
        'status':init_boss_status(),'trans_resist':False}
    b_atk={'st':'idle','t':0,'id':-1};ph_tr={'st':'none','t':0};b_anim=0
    eB.clear();pB.clear();telegraphs.clear();particles.clear();spread_groups.clear()

def get_thresh():
    m=boss['maxPh']
    if m<=1:return[0.5]
    if m<=2:return[0.66,0.33]
    if m<=4:return[0.8,0.6,0.4,0.2]
    return[0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2,0.1]

def _check_synergy_boss():
    global secret_synergy_bosses,secret_unlocked
    if secret_unlocked:return
    types_in_loadout=set()
    for i in range(3):
        if loadout[i]>=0 and loadout[i]<len(WPNS):
            types_in_loadout.add(WPNS[loadout[i]]['tp'])
    if 'tomato' in types_in_loadout and 'mask' in types_in_loadout and 'mic' in types_in_loadout:
        secret_synergy_bosses+=1
        save_game()
        if secret_synergy_bosses>=7:
            secret_unlocked=True
            activate_secret()
            save_game()

def hit_boss(d):
    global shake,coins,rN
    if not boss or not boss['alive'] or ph_tr['st']!='none':return
    st=boss.get('status',{})
    if st.get('hemorrhage_time',0)>0:d=int(d*1.5)
    if st.get('filming',False):st['film_dmg']=st.get('film_dmg',0)+d
    if st.get('irritated',False):d=int(d*1.2)
    if d<1:d=1
    if st.get('filming',False):st['film_dmg']=st.get('film_dmg',0)+d
    if st.get('frio_stacks',0)>0 and not st.get('gelo_ardente',False):
        boss['ms']=boss.get('_base_ms',boss['ms'])
    if d<1:d=1
    if boss.get('trans_resist',False):d=max(1,int(d*0.1))
    boss['hp']-=d
    burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,8,GOLD,1,4,2,5,300)
    ths=get_thresh();ratio=boss['hp']/boss['mhp']
    for i in range(len(ths)-1,-1,-1):
        if boss.get('_no_phase',False):break
        if ratio<=ths[i] and boss['phase']<i+1:
            boss['phase']=i+0.5
            if boss['hp']<1:boss['hp']=1
            ph_tr.update(st='up',t=0);boss['alive']=False
            eB.clear();telegraphs.clear();b_atk.update(st='idle',t=0,id=-1)
            for p in players:p['pullDur']=0
            return
    if boss['hp']<=0:
        boss['hp']=0;boss['alive']=False;shake=25
        boss['hp']=0;boss['alive']=False;shake=2
        _check_synergy_boss()
        for p in players:
            if p['alive']:p['inv']=max(p['inv'],2000)
        burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,40,ORANGE,2,9,3,9,1000)
        earned=0;bi=boss['idx']
        if not(b_coins[bi]&1):earned+=1;b_coins[bi]|=1;b_clear[bi]=1
        if fDmg==0 and not(b_coins[bi]&2):earned+=1;b_coins[bi]|=2
        if fTime<240000 and not(b_coins[bi]&4):earned+=1;b_coins[bi]|=4
        coins+=earned;rN=earned;save_game()
        s=BDATA[bi]['s'];is_last=SECS[s]['bosses'][-1]==bi
        if is_last and s<3:
            sched.append({'time':pygame.time.get_ticks()+1200,'fn':lambda:fade_to('sectorclear')})
        elif bi==0 and not post_b1:
            sched.append({'time':pygame.time.get_ticks()+1200,'fn':lambda:(set_gpost(),start_cs('post','result'))})
        else:sched.append({'time':pygame.time.get_ticks()+1200,'fn':lambda:go_st('result')})

def u_phtr(dt):
    if not boss:return
    boss['fl']=max(0,boss.get('fl',0)-dt)
    ph_tr['t']+=dt
    is_final=int(boss['phase'])>=boss['maxPh']
    if ph_tr['st']=='up':
        if is_final:
            boss['y']-=7;boss['fl']=200
            if boss['y']<-boss['h']-80:ph_tr.update(st='wait',t=0)
        else:
            boss['fl']=255;boss['trans_resist']=True
            if ph_tr['t']>1200:ph_tr.update(st='wait',t=0)
    elif ph_tr['st']=='wait' and ph_tr['t']>(2000 if is_final else 600):
        boss['phase']=int(boss['phase'])+1
        boss['hp']=boss['mhp']
        if is_final:
            boss['y']=-boss['h']-80;boss['x']=W-180;boss['tx']=W-180
        boss['alive']=True;boss['trans_resist']=False
        ph_tr.update(st='none',t=0);b_atk.update(st='idle',t=0,id=-1);shake=15
        burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,15,YELLOW,2,6,3,6,500)

def ai_choose():
    mx=min(4,boss['phase']+1)
    if boss['ai']<=0:return random.randint(0,mx)
    best=0;bs=-999
    for i in range(mx+1):
        s2=rng(0,2)+rng(0,max(1,4-boss['ai']))*0.4
        if s2>bs:bs=s2;best=i
    return best
def _boss_iv():
    base=max((1500 if boss['maxPh']>2 else 2200)-boss['ai']*100,600)
    if boss.get('status',{}).get('irritated',False):base=int(base*0.55)
    return base

def _boss_spd_mult():
    mult=1.0
    if boss:
        frio=boss.get('status',{}).get('frio_stacks',0)
        mult*=max(0.3,1-frio*0.015)
    if piano_passive_effect and piano_passive_effect['n']=='Boss Lento':mult*=0.8
    if boss and boss.get('_frozen',False):mult*=0.1
    return mult

def u_boss(dt):
    global shake,b_anim
    if not boss:return
    if ph_tr['st']!='none':u_phtr(dt);return
    if not boss['alive']:return
    b_anim+=dt;boss['fl']=max(0,boss['fl']-dt)
    u_boss_status(dt)
    u_piano_passive(dt)
    if not boss or not boss.get('alive'):return
    if boss.get('_frozen_time',0)>0:
        boss['_frozen_time']-=dt
        if boss['_frozen_time']<=0:boss['_frozen']=False
    if boss.get('_stun_time',0)>0:
        boss['_stun_time']-=dt
        b_atk['st']='idle';b_atk['t']=0
        return  # skip attack logic while stunned
    if boss.get('_no_phase',False):pass  # phase locked
    if not boss or not boss.get('alive'):return
    dx=boss['tx']-boss['x'];dy=boss['ty']-boss['y'];d=math.hypot(dx,dy)
    sm=_boss_spd_mult()
    if d>4:boss['x']+=(dx/d)*boss['ms']*sm;boss['y']+=(dy/d)*boss['ms']*sm
    if d<8 and b_atk['st']=='idle':
        boss['tx']=rng(W*0.4,W-boss['w']-20);boss['ty']=rng(GND-boss['h']-60,GND-boss['h'])
        boss['ms']=rng(1.5,2.5+boss['phase']*0.3)
    b_atk['t']+=dt
    iv=_boss_iv()
    if b_atk['st']=='idle':
        if b_atk['t']>=iv:b_atk['id']=ai_choose();b_atk['st']='windup';b_atk['t']=0
    elif b_atk['st']=='windup':
        if b_atk['t']>=max(200,600-boss['ai']*50):
            b_atk['st']='exec';b_atk['t']=0
            if boss.get('status',{}).get('abismo',False):
                hit_boss(8);burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,10,(200,0,0),2,5,3,6,400)
            BDATA[boss['idx']]['doA'](b_atk['id'])
    elif b_atk['st']=='exec':
        if b_atk['t']>=1600:b_atk['st']='rec';b_atk['t']=0
    elif b_atk['t']>=max(200,400-boss['ai']*30):b_atk['st']='idle';b_atk['t']=0
    for p in players:
        if p['alive'] and hit_cr(p['x']+16,p['y']+22,25,boss['x'],boss['y'],boss['w'],boss['h']):hit_p(p)

def u_telegraphs(dt):
    for tg in telegraphs[:]:
        tg['t']+=dt
        if tg['t']>=tg['dur']:
            if tg['cb']:tg['cb']()
            telegraphs.remove(tg)

def d_telegraphs(surf):
    for tg in telegraphs:
        prog=tg['t']/tg['dur'];pulse=0.15+math.sin(prog*TAU*3)*0.1
        a_surf=pygame.Surface((W,H),pygame.SRCALPHA)
        if tg['tp']=='circ':
            pygame.draw.circle(a_surf,(*tg['col'],int(pulse*255)),(int(tg['x']),int(tg['y'])),int(tg['r']))
            pygame.draw.circle(a_surf,(*tg['col'],int((pulse+0.2)*255)),(int(tg['x']),int(tg['y'])),int(tg['r']),2)
        else:
            pygame.draw.rect(a_surf,(*tg['col'],int(pulse*255)),(int(tg['x']-tg['w']//2),int(tg['y']-tg['h']//2),tg['w'],tg['h']))
        txt(a_surf,"!",int(tg['x']),int(tg['y']-(tg['r'] if tg['tp']=='circ' else tg['h']//2)-8),WHITE,14,True,True)
        surf.blit(a_surf,(0,0))

# ═══ BOSS ATTACK FUNCTIONS ═════════════════════════════
def _bp():return boss['x']+boss['w']//2,boss['y']+boss['h']//2
def _tp():t=tgt_p();return t['x']+t['w']//2
def _safe(fn):
    def wrapper(*a,**k):
        if boss and boss.get('alive'):fn(*a,**k)
    return wrapper

def b_atk_0(aid):  # Baron Von Beet
    bx,by=_bp();px=_tp();dr=1 if px>bx else -1
    if aid==0:add_tgR(bx+dr*50,GND-22,120,14,700,(139,34,82),_safe(lambda:add_eb(bx,GND-18,dr*5.5,0,14,(139,34,82),5000)))
    elif aid==1:
        def slam():
            global shake;boss['x']=clamp(px-boss['w']//2,50,W-boss['w']-50);boss['y']=GND-boss['h'];shake=15
            for i in range(-2,3):add_eb(boss['x']+boss['w']//2,GND-8,i*3,-5,8,BROWN,2000,True)
        add_tg(px,GND,50,900,BROWN,_safe(slam))
    elif aid==2:add_tg(bx,boss['y']+boss['h']//2,25,500,DKGREEN,_safe(lambda:add_aimed(bx,boss['y']+boss['h']//2,8,2.5,0.5,7,DKGREEN,2000)))
    else:
        for i in range(5):
            rx=clamp(px+rng(-120,120),60,W-60)
            add_tg(rx,35,18,400+i*120,(198,40,40),_safe(lambda rx=rx:add_eb(rx,35,rng(-0.3,0.3),5+rng(0,2),10,(198,40,40),3500,True)))

def b_atk_1(aid):  # Tick-Tock Twins
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(W//2,H//2,120,600,(218,165,32),_safe(lambda:add_ring(W//2,H//2,12,3,8,(218,165,32),4000)))
    elif aid==1:add_tg(px,boss['y']+boss['h']//2,30,500,(184,134,11),_safe(lambda:add_aimed(boss['x']+boss['w']//2,boss['y']+boss['h']//2,3,6,0.4,9,(184,134,11),3000)))
    elif aid==2:
        def redirect():
            for b in eB:
                t2=near_p(b['x'],b['y'])
                if t2:
                    dx=t2['x']+16-b['x'];dy=t2['y']+22-b['y'];d=math.hypot(dx,dy) or 1
                    sp=math.hypot(b['vx'],b['vy']) or 3;b['vx']=(dx/d)*sp;b['vy']=(dy/d)*sp
            add_aimed(bx,by,6,5,0.6,8,(255,82,82),3000)
        add_tg(bx,boss['y']+boss['h']//2,40,400,(255,82,82),_safe(redirect))
    else:
        for w in[0,1]:
            wx=[100,W-100][w]
            add_tg(wx,H//2,60,400+w*500,YELLOW,_safe(lambda wx=wx:[add_eb(wx,80+i*80,4 if wx==100 else -4,0,7,YELLOW,3500) for i in range(5)]))

def b_atk_2(aid):  # Madame Mushroom
    bx,by=_bp();px=_tp()
    if aid==0:
        c2=clamp(px+rng(-30,30),100,W-100)
        add_tg(c2,GND-50,50,500,(198,40,40),_safe(lambda c2=c2:[add_eb(c2+rng(-15,15),GND-40+rng(-15,15),rng(-0.3,0.3),rng(-0.3,0.3),7,(198,40,40),3500) for _ in range(5)]))
    elif aid==1:add_tgR(px,GND-15,30,10,500,(255,152,0),_safe(lambda:add_eb(bx,GND-15,dirst(bx,px)*5,-7,10,(255,152,0),4000,True)))
    elif aid==2:
        for i in range(4):
            tx2=clamp(px+rng(-80,80),80,W-80)
            add_tg(tx2,GND,15,600+i*100,BROWN,_safe(lambda tx2=tx2:add_eb(tx2,GND,0,-9,11,BROWN,1500)))
    else:add_tg(bx,boss['y']+boss['h']//2,80,700,GREEN,_safe(lambda:add_ring(boss['x']+boss['w']//2,boss['y']+boss['h']//2,24,2.5,7,GREEN,4500)))

def b_atk_3(aid):  # Iron Jaw
    global shake
    bx,by=_bp();px=_tp();dr=1 if px>bx else -1
    if aid==0:
        def dash():
            boss['tx']=-80 if dr>0 else W+80;boss['ms']=14
            sched.append({'time':pygame.time.get_ticks()+1200,'fn':lambda:boss and boss.update(tx=W-180,ms=3)})
        add_tgR(dr>0 and bx or 0,GND-28,(W-bx if dr>0 else bx),20,700,RED,_safe(dash))
    elif aid==1:
        def slam():
            global shake;boss['x']=clamp(px-boss['w']//2,50,W-boss['w']-50);boss['y']=GND-boss['h'];shake=10
            add_aimed(boss['x']+boss['w']//2,boss['y']+boss['h']//2,3,4,0.3,8,(120,144,156),2000)
        add_tg(px,GND-boss['h']//2,30,350,(255,82,82),_safe(slam))
    elif aid==2:
        def ground():
            global shake;boss['y']=GND-boss['h'];shake=20
            add_ring(boss['x']+boss['w']//2,GND-5,10,5,7,RED,2500)
        add_tg(bx,80,70,800,RED,_safe(ground))
    else:
        for i in range(3):
            def dash2(i=i):
                d2=1 if i%2==0 else -1
                add_tgR(d2>0 and 0 or W-100,GND-28,100,20,400,RED,_safe(lambda d2=d2:(boss.__setitem__('tx',-80 if d2>0 else W+80),boss.__setitem__('ms',15))))
            sched.append({'time':pygame.time.get_ticks()+i*900,'fn':_safe(dash2)})

def b_atk_4(aid):  # Shadow King
    global shake
    bx,by=_bp();t=tgt_p();px=_tp()
    if aid==0:
        ang=math.atan2(t['y']+22-by,t['x']+16-bx)
        add_tg(bx,by,30,500,(123,31,162),_safe(lambda:add_wave(bx,by,3,7,9,(123,31,162),3000,100)))
    elif aid==1:add_tg(bx,by,100,800,DKPURPLE,_safe(lambda:add_ring(bx,by,20,3.5,7,DKPURPLE,4000)))
    elif aid==2:
        ppx=clamp(t['x']+30+t['face']*t['spd']*20,80,W-boss['w']-80)
        def tele():
            global shake;boss['x']=ppx;boss['y']=GND-boss['h']
            for p in players:
                if p['alive']:p['pullX']=boss['x']+boss['w']//2;p['pullStr']=2;p['pullDur']=1500
            shake=15;add_ring(boss['x']+boss['w']//2,GND-10,12,4,7,PURPLE,2500)
        add_tg(ppx+boss['w']//2,GND-boss['h']//2,50,800,(224,64,251),_safe(tele))
    else:
        for i in range(30):
            def drop(i=i):
                add_eb(60+i%10*70,80+(i//10)*100,1.5,0,6,PURPLE,6000)
            sched.append({'time':pygame.time.get_ticks()+i*40,'fn':_safe(drop)})

def b_atk_5(aid):  # Frost Yeti
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,30,400,(136,204,255),_safe(lambda:add_aimed(bx,by,5,5,0.6,8,(136,204,255),3000)))
    elif aid==1:add_tg(bx,GND,80,600,(68,136,255),_safe(lambda:add_ring(bx,GND-5,16,4,9,(68,136,255),2500)))
    elif aid==2:
        for i in range(8):
            rx=rng(60,W-60)
            add_tg(rx,40,20,300+i*80,(170,224,255),_safe(lambda rx=rx:add_eb(rx,40,0,5+rng(0,2),10,(170,224,255),4000,True)))
    else:add_tg(W//2,H//2,150,900,(0,191,255),_safe(lambda:add_rain(30,7,(136,221,255),3500)))

def b_atk_6(aid):  # Stone Golem
    global shake
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,25,500,(160,128,96),_safe(lambda:add_aimed(bx,by,1,3,0,18,(160,128,96),4000)))
    elif aid==1:
        def erupt():
            global shake;shake=20
            for i in range(8):add_eb(boss['x']-20+i*((boss['w']+40)//7),GND-5,rng(-0.5,0.5),-rng(4,7),8,(139,115,85),2500,True)
        add_tgR(boss['x']-20,GND-10,boss['w']+40,10,500,(139,115,85),_safe(erupt))
    elif aid==2:
        for i in range(5):
            rx=clamp(px+rng(-100,100),60,W-60)
            add_tgR(rx,GND-20,20,10,400+i*100,(218,165,32),_safe(lambda rx=rx:add_eb(rx,GND-20,0,-8,12,(218,165,32),2000)))
    else:
        def slam():
            global shake;boss['y']=GND-boss['h'];shake=25;add_ring(bx,GND-5,12,5,9,(255,102,0),2500)
        add_tg(bx,by,60,700,(255,102,0),_safe(slam))

def b_atk_7(aid):  # Thunder Eagle
    global shake
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(px,tgt_p()['y'],20,300,GOLD,_safe(lambda:(add_eb(px,0,0,12,10,GOLD,2000),exec("global shake;shake=max(shake,8)"))))
    elif aid==1:
        def tele():
            global shake;boss['x']=clamp(px-boss['w']//2,50,W-boss['w']-50);boss['y']=GND-boss['h'];shake=12
            add_aimed(boss['x']+boss['w']//2,boss['y']+boss['h']//2,5,6,0.5,7,(255,193,7),2000)
        add_tg(px,GND-boss['h']//2,35,400,(255,193,7),_safe(tele))
    elif aid==2:
        for i in range(3):
            add_tg(rng(100,W-100),50,40,500+i*200,(255,241,118),_safe(lambda:add_rain(5,8,(255,241,118),2500)))
    else:
        def combo():
            add_ring(bx,by,24,4,7,(255,238,88),3000)
            sched.append({'time':pygame.time.get_ticks()+300,'fn':_safe(lambda:add_aimed(bx,by,6,7,0.8,12,YELLOW,2000))})
        add_tg(bx,by,80,600,(255,238,88),_safe(combo))

def b_atk_8(aid):  # Magma Wyrm
    global shake
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,25,400,ORANGE,_safe(lambda:add_aimed(bx,by,10,4,0.8,8,ORANGE,2500)))
    elif aid==1:
        def erupt():
            for i in range(10):add_eb(rng(50,W-50),GND,0,-rng(5,10),9,(230,74,25),2000,True)
        add_tgR(W//2,GND-15,W,10,600,(230,74,25),_safe(erupt))
    elif aid==2:
        for i in range(6):
            rx=rng(80,W-80)
            add_tgR(rx,GND-30,30,10,300+i*120,(255,152,0),_safe(lambda rx=rx:(add_eb(rx,GND-30,0,-4,14,(255,152,0),5000),burst(rx,GND-30,10,ORANGE,2,5,3,6,400))))
    else:
        def dbring():
            global shake;shake=25;add_ring(bx,GND-5,20,5,10,(255,61,0),3000);add_ring(bx,by,8,5,8,(255,171,0),2500)
        add_tg(bx,GND,120,800,(255,61,0),_safe(dbring))

def b_atk_9(aid):  # Ember Phoenix
    global shake
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,20,350,(255,111,0),_safe(lambda:add_wave(bx,by,5,6,9,(255,111,0),2500,60)))
    elif aid==1:
        def combo():
            add_ring(bx,by,18,3.5,8,(255,143,0),3500);add_rain(6,7,(255,171,0),3000)
        add_tg(W//2,H//2,100,700,(255,143,0),_safe(combo))
    elif aid==2:
        def tele():
            global shake;boss['x']=clamp(px-boss['w']//2,50,W-boss['w']-50);boss['y']=GND-boss['h'];shake=20
            for p in players:
                if p['alive']:p['pullX']=bx;p['pullStr']=1.5;p['pullDur']=1000
            add_ring(boss['x']+boss['w']//2,GND-10,12,4,8,(255,214,0),2500)
        add_tg(px,GND-20,50,500,(255,214,0),_safe(tele))
    else:
        def nova():
            global shake;shake=30
            for i in range(40):
                def sp(i=i):
                    a=rng(0,TAU);sp2=rng(2,6)
                    add_eb(bx+math.cos(a)*30,by+math.sin(a)*30,math.cos(a)*sp2,math.sin(a)*sp2,7,(255,61,0) if i%2 else(255,111,0),3000)
                sched.append({'time':pygame.time.get_ticks()+i*30,'fn':_safe(sp)})
        add_tg(W//2,H//2,160,1000,(255,61,0),_safe(nova))

def b_atk_10(aid):  # Cloud Serpent
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,25,350,(144,202,249),_safe(lambda:add_aimed(bx,by,8,5,0.6,8,(144,202,249),2500)))
    elif aid==1:
        for i in range(4):
            rx=rng(80,W-80);ry=rng(80,250)
            add_tg(rx,ry,50,500+i*150,LTBLUE,_safe(lambda rx=rx,ry=ry:add_ring(rx,ry,8,3,7,LTBLUE,3500)))
    elif aid==2:
        def tele():
            for p in players:
                if p['alive']:p['pullX']=bx;p['pullStr']=3;p['pullDur']=1500
            add_ring(bx+100,by,20,2,7,(0,172,193),4000)
        add_tg(bx,by,100,700,(0,172,193),_safe(tele))
    elif aid==3:
        for i in range(3):
            def dash(i=i):
                boss['tx']=rng(100,W-100);boss['ty']=rng(80,200);boss['ms']=12
                add_aimed(boss['x']+boss['w']//2,boss['y']+boss['h']//2,4,7,0.4,9,(0,151,167),2000)
            sched.append({'time':pygame.time.get_ticks()+i*400,'fn':_safe(dash)})
    else:
        def sweep():
            for i in range(60):
                def sp(i=i):
                    sx=-10 if i%2==0 else W+10;vx=5 if i%2==0 else -5
                    add_eb(sx,rng(50,H-100),vx,rng(-2,2),7,(128,222,234) if i%2 else(77,208,225),4000)
                sched.append({'time':pygame.time.get_ticks()+i*25,'fn':_safe(sp)})
        add_tg(W//2,H//2,200,1500,(0,96,100),_safe(sweep))

def b_atk_11(aid):  # Star Guardian
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,30,400,(206,147,216),_safe(lambda:add_ring(bx,by,6,4,8,(206,147,216),3000)))
    elif aid==1:
        ppx=clamp(px,100,W-100)
        def pull():
            for p in players:
                if p['alive']:p['pullX']=ppx;p['pullStr']=2;p['pullDur']=1200
            add_ring(ppx,H//2,12,3.5,7,(171,71,188),3500)
        add_tg(ppx,H//2,60,600,(171,71,188),_safe(pull))
    elif aid==2:
        for i in range(5):
            add_tg(rng(100,W-100),rng(50,200),25,400+i*100,(225,190,231),_safe(lambda:add_eb(rng(100,W-100),-10,rng(-2,2),rng(2,5),9,(225,190,231),3000,True)))
    elif aid==3:add_tg(bx,by,70,500,(123,31,162),_safe(lambda:add_ring(bx,by,20,5,7,(123,31,162),3000)))
    else:
        def ult():
            add_rain(40,8,(206,147,216),4000);add_ring(bx,by,8,6,10,(106,27,154),2500)
        add_tg(W//2,H//2,200,1200,DKPURPLE,_safe(ult))

def b_atk_12(aid):  # Wind Djinn
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,25,300,(128,222,234),_safe(lambda:add_wave(bx,by,6,5,8,(128,222,234),2500,50)))
    elif aid==1:
        for i in range(4):
            rx=rng(60,W-60);ry=rng(80,250)
            add_tg(rx,ry,50,500+i*150,(77,208,225),_safe(lambda rx=rx,ry=ry:add_ring(rx,ry,8,3,7,(77,208,225),3500)))
    elif aid==2:
        def pull():
            for p in players:
                if p['alive']:p['pullX']=bx;p['pullStr']=3;p['pullDur']=1500
            add_ring(bx+100,by,20,2,7,(0,172,193),4000)
        add_tg(bx,by,100,700,(0,172,193),_safe(pull))
    elif aid==3:
        for i in range(3):
            def dash(i=i):
                boss['tx']=rng(100,W-100);boss['ty']=rng(80,200);boss['ms']=12
                add_aimed(boss['x']+boss['w']//2,boss['y']+boss['h']//2,4,7,0.4,9,(0,151,167),2000)
            sched.append({'time':pygame.time.get_ticks()+i*400,'fn':_safe(dash)})
    else:
        def sweep():
            for i in range(60):
                def sp(i=i):
                    sx=-10 if i%2==0 else W+10;vx=5 if i%2==0 else -5
                    add_eb(sx,rng(50,H-100),vx,rng(-2,2),7,(128,222,234) if i%2 else(77,208,225),4000)
                sched.append({'time':pygame.time.get_ticks()+i*25,'fn':_safe(sp)})
        add_tg(W//2,H//2,200,1500,(0,96,100),_safe(sweep))

def b_atk_13(aid):  # Sky Leviathan
    global shake
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,30,400,(129,212,250),_safe(lambda:add_aimed(bx,by,7,6,0.5,9,(129,212,250),2800)))
    elif aid==1:
        for i in range(6):
            rx=rng(80,W-80)
            add_tg(rx,50,25,300+i*100,(79,195,247),_safe(lambda rx=rx:[add_eb(rx,50,rng(-1,1),rng(3,6),10,(79,195,247),3500,True) for _ in range(3)]))
    elif aid==2:
        def ground():
            global shake;shake=20
            for i in range(15):add_eb(rng(50,W-50),GND,0,-rng(5,10),10,(41,182,246),2500,True)
            for p in players:
                if p['alive']:p['pullX']=bx;p['pullStr']=2;p['pullDur']=1000
        add_tg(bx,GND,100,600,(41,182,246),_safe(ground))
    elif aid==3:
        def combo():
            add_ring(bx+60,by,24,2,8,(2,136,209),4000)
            add_wave(bx,by,8,7,11,(1,87,155),2000,100)
        add_tg(bx,by,80,500,(2,136,209),_safe(combo))
    else:
        def converge():
            for i in range(80):
                def sp(i=i):
                    if i%4<2:sx=rng(50,W-50);sy=-10 if i%4==0 else H+10
                    else:sx=-10 if i%4==2 else W+10;sy=rng(50,H-50)
                    ang=math.atan2(H//2-sy,W//2-sx)
                    add_eb(sx,sy,math.cos(ang)*rng(3,6),math.sin(ang)*rng(3,6),7,(129,212,250) if i%2 else(79,195,247),4000)
                sched.append({'time':pygame.time.get_ticks()+i*20,'fn':_safe(sp)})
        add_tg(W//2,H//2,220,1800,(1,87,155),_safe(converge))

def b_atk_14(aid):  # Solar Phoenix
    global shake
    bx,by=_bp();px=_tp()
    if aid==0:add_tg(bx,by,25,350,(255,213,79),_safe(lambda:add_wave(bx,by,4,7,10,(255,213,79),2000,80)))
    elif aid==1:
        def combo():
            add_ring(bx,by,24,4,8,(255,179,0),3500);add_rain(12,7,(255,160,0),3000)
        add_tg(W//2,H//2,140,800,(255,179,0),_safe(combo))
    elif aid==2:
        def heal():
            hp_heal=round(boss['mhp']*0.05);boss['hp']=min(boss['hp']+hp_heal,boss['mhp'])
            burst(bx,by,20,GREEN,2,5,3,6,500);add_ring(bx,by,16,5,8,(255,143,0),2500)
        add_tg(bx,by,50,600,(255,143,0),_safe(heal))
    elif aid==3:
        for i in range(8):
            add_tg(rng(80,W-80),rng(50,200),30,400+i*80,(255,111,0),_safe(lambda:add_eb(rng(80,W-80),-10,0,rng(5,10),12,(255,111,0),3000,True)))
    else:
        def supernova():
            global shake;shake=30
            for i in range(100):
                def sp(i=i):
                    a=rng(0,TAU);sp2=rng(2,8)
                    add_eb(bx+math.cos(a)*50,by+math.sin(a)*50,math.cos(a)*sp2,math.sin(a)*sp2,6,(255,111,0) if i%2 else(255,179,0),3000)
                sched.append({'time':pygame.time.get_ticks()+i*20,'fn':_safe(sp)})
        add_tg(W//2,H//2,250,2000,(230,81,0),_safe(supernova))

def b_atk_15(aid):  # ???
    global shake
    bx,by=_bp();px=_tp()
    cols=[RED,(255,145,0),YELLOW,GREEN,CYAN,(213,0,249),(245,0,87),(255,109,0),(118,255,3),(0,229,255)]
    c=cols[boss['phase']%len(cols)]
    if aid==0:add_tg(bx,by,20,300,c,_safe(lambda:add_aimed(bx,by,8+int(boss['phase'])*2,5,1,7,c,2500)))
    elif aid==1:
        n=int(3+boss['phase'])
        for i in range(n):
            a=rng(0,TAU)
            add_tg(bx+math.cos(a)*100,by+math.sin(a)*100,30,400+i*100,cols[(boss['phase']+1)%10],
                _safe(lambda a=a:add_eb(bx+math.cos(a)*100,by+math.sin(a)*100,-math.cos(a)*3,-math.sin(a)*3,10,cols[(boss['phase']+1)%10],3000)))
    elif aid==2:
        def pull():
            for p in players:
                if p['alive']:p['pullX']=bx;p['pullStr']=2+boss['phase']*0.3;p['pullDur']=1500
            add_ring(bx,by,int(20+boss['phase']*5),3+boss['phase']*0.5,7,cols[(boss['phase']+2)%10],3500)
        add_tg(W//2,H//2,200,800,cols[(boss['phase']+2)%10],_safe(pull))
    elif aid==3:
        for i in range(int(5+boss['phase'])):
            rx=rng(60,W-60)
            add_tg(rx,30,20,250+i*60,cols[(boss['phase']+3)%10],_safe(lambda rx=rx:add_eb(rx,30,rng(-1,1),rng(4,8),9,cols[(boss['phase']+3)%10],3000,True)))
    else:
        def chaos():
            global shake;shake=30
            for i in range(int(60+boss['phase']*10)):
                def sp(i=i):
                    a=rng(0,TAU);sp2=rng(2,9)
                    add_eb(bx+math.cos(a)*60,by+math.sin(a)*60,math.cos(a)*sp2,math.sin(a)*sp2,6,cols[i%10],3500)
                sched.append({'time':pygame.time.get_ticks()+i*15,'fn':_safe(sp)})
        add_tg(W//2,H//2,250,1500,cols[(boss['phase']+4)%10],_safe(chaos))

# ═══ BOSS DATA ══════════════════════════════════════════
BDATA=[
    {'n':'Baron Von Beet','s':0,'w':60,'h':80,'hp':80,'ph':2,'ai':1,'doA':b_atk_0},
    {'n':'Tick-Tock Twins','s':0,'w':50,'h':55,'hp':100,'ph':2,'ai':2,'doA':b_atk_1},
    {'n':'Madame Mushroom','s':0,'w':70,'h':90,'hp':120,'ph':2,'ai':3,'doA':b_atk_2},
    {'n':'Iron Jaw','s':0,'w':90,'h':55,'hp':150,'ph':2,'ai':4,'doA':b_atk_3},
    {'n':'Shadow King','s':0,'w':55,'h':100,'hp':180,'ph':2,'ai':5,'doA':b_atk_4},
    {'n':'Frost Yeti','s':1,'w':70,'h':90,'hp':200,'ph':3,'ai':6,'doA':b_atk_5},
    {'n':'Stone Golem','s':1,'w':80,'h':85,'hp':230,'ph':3,'ai':7,'doA':b_atk_6},
    {'n':'Thunder Eagle','s':1,'w':60,'h':70,'hp':260,'ph':3,'ai':8,'doA':b_atk_7},
    {'n':'Magma Wyrm','s':1,'w':90,'h':80,'hp':300,'ph':3,'ai':9,'doA':b_atk_8},
    {'n':'Ember Phoenix','s':1,'w':70,'h':90,'hp':340,'ph':3,'ai':10,'doA':b_atk_9},
    {'n':'Cloud Serpent','s':2,'w':80,'h':70,'hp':380,'ph':5,'ai':11,'doA':b_atk_10},
    {'n':'Star Guardian','s':2,'w':55,'h':95,'hp':420,'ph':5,'ai':12,'doA':b_atk_11},
    {'n':'Wind Djinn','s':2,'w':60,'h':85,'hp':460,'ph':5,'ai':13,'doA':b_atk_12},
    {'n':'Sky Leviathan','s':2,'w':100,'h':80,'hp':500,'ph':5,'ai':14,'doA':b_atk_13},
    {'n':'Solar Phoenix','s':2,'w':70,'h':90,'hp':550,'ph':5,'ai':15,'doA':b_atk_14},
    {'n':'???','s':3,'w':60,'h':100,'hp':750,'ph':10,'ai':16,'doA':b_atk_15}
]


# BLOCO 3: Sistema de Status Effects
# ═══════════════════════════════════════════════════════════

def init_boss_status():
    return{'burn_time':0,'burn_total':0,'burn_tick':0,
           'purg_time':0,'purg_stacks':0,'purg_total':0,'purg_tick':0,
           'blackflame':False,'bf_tick':0,
           'poison_time':0,'poison_stacks':0,'poison_tick':0,
           'bleed_time':0,'bleed_tick':0,'bleed_total':0,'hemorrhage_time':0,
           'nail_stacks':0,
           'irritated':False,'irrit_time':0,'tomato_hits':0,'mic_irrit':False,'mic_timer':0,
           'mask_attached':False,'mask_loucura':0,'mask_tick':0,
           'frio_stacks':0,'gelo_ardente':False,'ga_tick':0,
           'picancia_stacks':0,'pic_move_tick':0,'abismo':False,
           'filming':False,'film_time':0,'film_dmg':0,'film_hit_player':False,
           'collapsed':False,'collapse_time':0}

def apply_burn(dur=2000):
    if not boss or not boss.get('alive'):return
    boss['status']['burn_time']=max(boss['status']['burn_time'],dur)

def apply_purgatory(dur=4000,stacks=1):
    if not boss or not boss.get('alive'):return
    st=boss['status']
    if st['purg_time']<=0:st['purg_stacks']=0
    st['purg_time']=max(st['purg_time'],dur);st['purg_stacks']+=stacks

def apply_poison(dur=24000):
    if not boss or not boss.get('alive'):return
    st=boss['status']
    if st['poison_time']<=0:st['poison_time']=dur;st['poison_stacks']=1;st['poison_tick']=0
    else:st['poison_stacks']+=1

def apply_bleed(dur=15000):
    if not boss or not boss.get('alive'):return
    boss['status']['bleed_time']=dur;boss['status']['bleed_tick']=0

def apply_hemorrhage(dur=10000):
    if not boss or not boss.get('alive'):return
    boss['status']['hemorrhage_time']=max(boss['status']['hemorrhage_time'],dur)
def apply_frio(stacks=1):
    if not boss or not boss.get('alive'):return
    st=boss['status']
    if st.get('gelo_ardente',False):return
    st['frio_stacks']=min(st.get('frio_stacks',0)+stacks,10)

def apply_picancia(stacks=1):
    if not boss or not boss.get('alive'):return
    st=boss['status']
    if st.get('abismo',False):return
    st['picancia_stacks']=min(st.get('picancia_stacks',0)+stacks,10)
def _trigger_collapse():
    if not boss or not boss.get('alive'):return
    st=boss.get('status',{})
    st['collapsed']=True;st['collapse_time']=4000
    st['irritated']=False;st['irrit_time']=0
    b_atk.update(st='idle',t=0,id=-1)
    burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,25,(220,20,60),3,7,4,8,600)

def _trigger_trauma():
    if not boss or not boss.get('alive'):return
    boss['hp']=max(1,int(boss['mhp']*0.5))
    boss['maxPh']=boss['phase']
    for i in range(int(boss['phase']),boss['maxPh']+1):
        pass
    # Skip to final
    while boss['phase']<boss['maxPh']:
        boss['phase']+=1
    st=boss.get('status',{})
    st['collapsed']=False
    burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,50,(200,100,255),3,9,4,9,1000)

SLOT_RESULTS=[('DANO',6,RED),('CURA',0,GREEN),('FOGO',0,ORANGE),('VENENO',0,(0,180,0)),
    ('SANGUE',0,(200,0,0)),('GELO',0,CYAN),('PICANTE',0,(200,50,0)),('JACKPOT',15,GOLD)]

def _apply_slot(idx):
    n,dmg,c=SLOT_RESULTS[idx]
    if n=='DANO':hit_boss(dmg)
    elif n=='CURA':
        for p in players:
            if p['alive']:p['hp']=min(p['hp']+1,p['mhp']);break
    elif n=='FOGO':apply_burn(3000)
    elif n=='VENENO':apply_poison(15000)
    elif n=='SANGUE':apply_bleed(5000)
    elif n=='GELO':apply_frio(3)
    elif n=='PICANTE':apply_picancia(3)
    elif n=='JACKPOT':
        hit_boss(dmg);apply_burn(5000);apply_poison(24000);apply_frio(5)
        if boss:burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,50,GOLD,3,9,4,9,1000)

PIANO_EFFECTS=[
    {'n':'Dano Dobrado','dur':4000,'c':RED},
    {'n':'Tiros Gigantes','dur':4000,'c':PURPLE},
    {'n':'Boss Lento','dur':4000,'c':CYAN},
    {'n':'Chuva Tomates','dur':3000,'c':(220,20,60)},
    {'n':'Raios','dur':3000,'c':YELLOW},
    {'n':'Portal','dur':2000,'c':(100,0,200)},
]

def u_piano_passive(dt):
    global piano_passive_timer,piano_passive_effect,piano_passive_dur,special_charge
    if not has_secret():return
    piano_passive_timer+=dt
    if piano_passive_timer>=5000:
        piano_passive_timer=0
        piano_passive_effect=PIANO_EFFECTS[random.randint(0,len(PIANO_EFFECTS)-1)]
        piano_passive_dur=piano_passive_effect['dur']
    if piano_passive_dur>0:
        piano_passive_dur-=dt
        eff=piano_passive_effect
        if eff['n']=='Chuva Tomates':
            if random.random()<0.08:
                tx2=rng(50,W-50)
                pB.append({'x':tx2,'y':-10,'vx':rng(-1,1),'vy':rng(2,4),
                    'ext':'tomato_aud','life':3000,'pid':0,'elap':0,'sx':tx2,
                    'ret':False,'expl':False,'hitC':0,'hitCD':0,'gid':0,'hit':False,'landed':False})
        if eff['n']=='Raios':
            if random.random()<0.03 and boss and boss.get('alive'):
                rx=boss['x']+rng(-30,boss['w']+30)
                burst(rx,boss['y'],8,YELLOW,2,5,3,6,300)
                if abs(rx-(boss['x']+boss['w']//2))<50:hit_boss(5)
        if eff['n']=='Portal':
            eB.clear()
            for b2 in pB[:]:
                if b2.get('ext') not in('firering','rod'):pB.remove(b2)
        if piano_passive_dur<=0:piano_passive_effect=None

def piano_dmg_mult():
    if piano_passive_effect and piano_passive_effect['n']=='Dano Dobrado':return 2
    return 1

def piano_proj_size():
    if piano_passive_effect and piano_passive_effect['n']=='Tiros Gigantes':return 2.0
    return 1.0

def piano_boss_spd():
    if piano_passive_effect and piano_passive_effect['n']=='Boss Lento':return 0.8
    return 1.0
WISHES=[
    {'n':'Queime!','desc':'Fogo maximo em todos os stacks','c':ORANGE},
    {'n':'Congele!','desc':'Gelo maximo + trava boss 15s','c':CYAN},
    {'n':'Exploda!','desc':'Dano imenso imediato','c':RED},
    {'n':'Desapareca!','desc':'Boss vai para ultima fase','c':PURPLE},
    {'n':'Relampago!','desc':'Trovões do céu','c':YELLOW},
    {'n':'Olhe para o abismo!','desc':'Marca do abismo permanente','c':(200,0,0)},
]

def u_special_charge(dt):
    global special_charge,wish_active,wish_opts,wish_sel,wish_timer
    global wish_thunder_pts
    if not has_secret():return
    if boss and boss.get('status',{}).get('filming',False):return
    if wish_active:
        wish_timer+=dt
        if wish_timer>30000:wish_active=False
        # Thunder effect
        if wish_thunder_pts:
            for tp2 in wish_thunder_pts[:]:
                tp2['t']+=dt
                if tp2['t']>2000:wish_thunder_pts.remove(tp2)
                elif tp2['t']%200<dt:
                    if boss and boss.get('alive'):hit_boss(3)
        return
    if special_charge>=100 and p_j(players[0],'special'):
        # Open wish screen
        wish_active=True;wish_opts=WISHES[:];wish_sel=0;wish_timer=0
        wish_thunder_pts=[]

def apply_wish(idx):
    global special_charge,wish_active,wish_thunder_pts
    w=WISHES[idx]
    if not boss or not boss.get('alive'):wish_active=False;special_charge=0;return
    st=boss.get('status',{})
    if w['n']=='Queime!':
        st['burn_time']=30000;st['burn_total']=max(st.get('burn_total',0),5001)
        st['purg_time']=20000;st['purg_stacks']=5;st['purg_total']=max(st.get('purg_total',0),10001)
        st['blackflame']=True
        burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,40,ORANGE,3,9,4,9,1000)
    elif w['n']=='Congele!':
        st['frio_stacks']=10;st['gelo_ardente']=True
        boss['_frozen']=True;boss['_frozen_time']=15000
        for b2 in eB[:]:
            b2['vx']*=0.5;b2['vy']*=0.5
        burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,40,CYAN,3,9,4,9,1000)
    elif w['n']=='Exploda!':
        hit_boss(int(boss['mhp']*0.4))
        shake=40;burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,60,RED,3,12,4,12,1200)
    elif w['n']=='Desapareca!':
        if int(boss['phase'])>=boss['maxPh']:
            # Ja na ultima fase → vitoria instantanea
            boss['hp']=0;boss['alive']=False;shake=30
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,50,PURPLE,3,10,4,10,1000)
            for p in players:
                if p['alive']:p['inv']=max(p['inv'],2000)
            earned=0;bi=boss['idx']
            if not(b_coins[bi]&1):earned+=1;b_coins[bi]|=1;b_clear[bi]=1
            if fDmg==0 and not(b_coins[bi]&2):earned+=1;b_coins[bi]|=2
            if fTime<240000 and not(b_coins[bi]&4):earned+=1;b_coins[bi]|=4
            global coins,rN;coins+=earned;rN=earned;save_game()
            sched.append({'time':pygame.time.get_ticks()+1500,'fn':lambda:go_st('result')})
        else:
            # Vai para a PROXIMA fase apenas
            boss['phase']=int(boss['phase'])+1
            boss['hp']=boss['mhp']
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,30,PURPLE,3,8,4,8,800)
    elif w['n']=='Relampago!':
        wish_thunder_pts=[]
        for i in range(20):
            wish_thunder_pts.append({'x':rng(50,W-50),'y':0,'t':i*100,'dmg':8})
            burst(rng(50,W-50),rng(50,GND),5,YELLOW,2,4,3,5,400)
    elif w['n']=='Olhe para o abismo!':
        st['abismo']=True
        boss['_no_phase']=True
        hit_boss(int(boss['mhp']*0.1))
        burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,40,(200,0,0),3,9,4,9,1000)
    special_charge=0;wish_active=False

def d_wish_screen(surf):
    if not wish_active:return
    s2=pygame.Surface((W,H),pygame.SRCALPHA);s2.fill((0,0,0,180));surf.blit(s2,(0,0))
    txt(surf,"DESEJO",W//2,40,(200,0,0),36,True,True)
    for i,w in enumerate(WISHES):
        y=90+i*55;sel=(i==wish_sel)
        c2=w['c'] if sel else GRAY
        pre="> " if sel else "   "
        txt(surf,pre+w['n'],W//2,y,c2,20,True,True)
        if sel:txt(surf,w['desc'],W//2,y+22,(180,180,180),11,True,True)
    txt(surf,"W/S: Navegar | Enter: Escolher",W//2,H-25,GRAY,12,True,True)

def in_cone(px,py,pf,bx,by,rng_deg=50,rng_dist=200):
    dx=bx-px;dy=by-py;d=math.hypot(dx,dy)
    if d>rng_dist or d<1:return False,0
    ang=math.atan2(dy,dx);facing=0 if pf>0 else math.pi
    diff=abs(((ang-facing+math.pi)%TAU)-math.pi)
    return diff<math.radians(rng_deg),d

def u_boss_status(dt):
    if not boss or not boss.get('alive'):return
    st=boss['status']
    if st.get('hemorrhage_time',0)>0:st['hemorrhage_time']-=dt
    # ── FIRE CHAIN ──
    if st.get('burn_time',0)>0:
        st['burn_time']-=dt;st['burn_total']+=dt;st['burn_tick']-=dt
        if st['burn_tick']<=0:
            st['burn_tick']=500;hit_boss(1)
            burst(boss['x']+boss['w']//2,boss['y'],5,ORANGE,1,3,2,4,200)
        if st.get('gelo_ardente',False):
            st['gelo_ardente']=False;st['frio_stacks']=0
            st['burn_time']=0;st['burn_total']=0
            hit_boss(30)
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,40,(0,200,255),3,8,4,8,800)
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,40,ORANGE,3,8,4,8,800)
        if st.get('picancia_stacks',0)>0 and not st.get('abismo',False):
            st['abismo']=True;st['picancia_stacks']=0
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,25,(200,0,0),2,6,3,7,500)
        if st.get('burn_total',0)>=5000 and st.get('purg_time',0)<=0:
            st['purg_time']=4000;st['purg_stacks']=1;st['purg_total']=0
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,20,PURPLE,2,5,3,6,500)
    if not boss or not boss.get('alive'):return
    if st.get('purg_time',0)>0:
        st['purg_time']-=dt;st['purg_total']+=dt;st['purg_tick']-=dt
        if st['purg_tick']<=0:
            st['purg_tick']=300;hit_boss(int(3*st.get('purg_stacks',1)))
            burst(boss['x']+boss['w']//2,boss['y'],8,PURPLE,1,4,2,5,200)
        if st.get('purg_total',0)>=10000 and not st.get('blackflame',False):
            st['blackflame']=True
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,40,(50,0,50),3,8,4,8,1000)
    if not boss or not boss.get('alive'):return
    if st.get('blackflame',False):
        st['bf_tick']-=dt
        if st['bf_tick']<=0:
            st['bf_tick']=200;hit_boss(8)
            burst(boss['x']+boss['w']//2+random.randint(-20,20),boss['y']+random.randint(0,boss['h']),3,(80,0,80),1,3,2,4,200)
    if not boss or not boss.get('alive'):return
    # ── POISON ──
    if st.get('poison_time',0)>0:
        st['poison_time']-=dt;st['poison_tick']-=dt
        if st['poison_tick']<=0:
            st['poison_tick']=1000;hit_boss(int(1*st.get('poison_stacks',1)))
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,3,(0,200,0),1,2,2,3,200)
    if not boss or not boss.get('alive'):return
    # ── BLEED ──
    if st.get('bleed_time',0)>0:
        st['bleed_time']-=dt;st['bleed_tick']-=dt
        if st['bleed_tick']<=0:
            st['bleed_tick']=500;hit_boss(5)
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,5,RED,1,4,2,5,300)
    if not boss or not boss.get('alive'):return
    # ── MASK LOUCURA ──
    if st.get('mask_attached',False):
        st['mask_tick']-=dt
        if st['mask_tick']<=0:
            st['mask_tick']=1500;st['mask_loucura']=st.get('mask_loucura',0)+1
            burst(boss['x']+boss['w']//2,boss['y']-10,5,(180,180,200),1,3,2,4,300)
    # ── FRIO → GELO ARDENTE ──
    if st.get('frio_stacks',0)>=10 and not st.get('gelo_ardente',False):
        st['gelo_ardente']=True;st['ga_tick']=0
        burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,30,(0,200,255),2,7,3,7,700)
    if st.get('gelo_ardente',False):
        st['ga_tick']-=dt
        if st['ga_tick']<=0:
            st['ga_tick']=300;hit_boss(4)
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,5,(0,200,255),1,3,2,4,200)
    if not boss or not boss.get('alive'):return
    # ── PICANCIA movement damage ──
    if st.get('picancia_stacks',0)>0:
        dx2=boss['tx']-boss['x'];dy2=boss['ty']-boss['y']
        if math.hypot(dx2,dy2)>2:
            st['pic_move_tick']-=dt
            if st['pic_move_tick']<=0:
                st['pic_move_tick']=500;hit_boss(st['picancia_stacks'])
                burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,3,(200,0,0),1,2,2,3,200)
    # ── CAMERA FILMING ──
    if st.get('filming',False):
        st['film_time']-=dt
        if st['film_time']<=0:
            st['filming']=False
            dmg=int(st.get('film_dmg',0)*1.5)
            if dmg>0:
                hit_boss(dmg)
                burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,30,(100,200,255),2,7,3,7,700)
            if st.get('film_hit_player',False):
                for p in players:
                    if p['alive'] and p['hp']>1:p['hp']-=1
                    burst(p['x']+16,p['y']+22,15,RED,2,5,2,5,500);break
    # ── Piano note visuals on boss ──
    if piano_passive_effect:
        c=piano_passive_effect['c']
        for _ in range(1):
            burst(boss['x']+rng(0,boss['w']),boss['y']+rng(0,boss['h']),1,c,0.5,1.5,1,2,300)
    # ── IRRITATION ──
    if st.get('irrit_time',0)>0:
        st['irrit_time']-=dt
        if st.get('mic_irrit',False):
            st['mic_timer']=st.get('mic_timer',0)-dt
            if st['mic_timer']<=0:
                st['mic_timer']=1000;tgt=tgt_p()
                if tgt:pB.append({'x':tgt['x']+16,'y':-20,'vx':rng(-1,1),'vy':rng(2,4),
                    'ext':'tomato_aud','life':5000,'pid':0,'elap':0,'sx':tgt['x']+16,
                    'ret':False,'expl':False,'hitC':0,'hitCD':0,'gid':0,'hit':False,'landed':False})
        if st['irrit_time']<=0:st['irritated']=False;st['mic_irrit']=False
    # ── COLLAPSE ──
    if st.get('collapse_time',0)>0:
        st['collapse_time']-=dt
        if st['collapse_time']<=0:
            st['collapsed']=False

    # ── BLOOD 15s → HEMORRHAGE PERMANENTE ──
    if st.get('bleed_time',0)>0 and st.get('bleed_total',0)<15000:
        st['bleed_total']=st.get('bleed_total',0)+dt
        if st['bleed_total']>=15000:
            apply_hemorrhage(999999)
            burst(boss['x']+boss['w']//2,boss['y']+boss['h']//2,20,(200,0,0),2,6,3,7,600)

# ═══ MISSING GLOBALS & INPUT ═══════════════════════════════
keys = {}; just_pressed = {}; players = []; num_players = 1; local_pid = 0
sh_sel = 0; bs_sel = 0; sec_sel = 0; mode_sel = 0; save_sel = 0
ctrl_p = 0; ctrl_a = 0; ctrl_r = False; bossI = 0
cs = None; cs_nxt = ''; overlay = None; ov_sel = 0; admin = False; running = True
ts = {'type':0,'phase':0,'t':0,'progress':0,'px':W//2,'py':H-80,'php':3,
      'entities':[],'warnings':[],'mini_boss':None,'lss':0}
C_LABELS = ['Esquerda','Direita','Pular','Atirar','Dash','Trocar']
C_ACTS=['left','right','jump','shoot','dash','swap']

def jp(k):
    if just_pressed.get(k,False): just_pressed[k]=False; return True
    return False
def _shk(v):
    global shake; shake=max(shake,v)

# ═══ STATE MANAGEMENT ═══════════════════════════════════════
def go_st(s):
    global state; state=s
def fade_to(s,cb=None):
    global fadeA; fadeA=1.0
    def _do():
        global state; state=s
        if cb: cb()
    sched.append({'time':pygame.time.get_ticks()+80,'fn':_do})
def set_gpost():
    global post_b1; post_b1=True
def start_fight():
    global players,fDmg,fTime,piano_variant,piano_laser_active,piano_laser_power
    global special_charge,wish_active,piano_passive_timer,piano_passive_effect,piano_passive_dur
    global wish_thunder_pts
    players=[mk_p(i) for i in range(num_players)]
    init_boss(bossI);fDmg=0;fTime=0
    pB.clear();eB.clear();telegraphs.clear();particles.clear();spread_groups.clear()
    piano_variant=0;piano_laser_active=False;piano_laser_power=0
    special_charge=0;wish_active=False;wish_thunder_pts=[]
    piano_passive_timer=0;piano_passive_effect=None;piano_passive_dur=0
def process_sched():
    now=pygame.time.get_ticks()
    for ev in sched[:]:
        if now>=ev['time']: ev['fn'](); sched.remove(ev)

# ═══ CUTSCENE SYSTEM ═══════════════════════════════════════
def _cs_text_anim(surf,text,x,y,c,sz,prog):
    n=int(len(text)*clamp((prog-0.15)*2,0,1))
    if n>0: txt(surf,text[:n],x,y,c,sz,True,True)

def draw_intro_0(s,p):
    s.fill((10,26,10));pygame.draw.rect(s,(42,106,26),(0,320,W,180))
    txt(s,"Numa fazenda pacifica...",W//2,100,WHITE,22,True,True)
def draw_intro_1(s,p):
    s.fill((10,10,26))
    if p>0.4: txt(s,"BAM!",W//2,200,YELLOW,40,True,True)
    txt(s,"O mindinho do pe!",W//2,80,WHITE,18,True,True)
def draw_intro_2(s,p):
    s.fill((26,10,26))
    if p>0.55: txt(s,"BONK!",W//2,130,YELLOW,48,True,True)
    txt(s,"A beterraba acertou Zeus!",W//2,H-40,WHITE,18,True,True)
def draw_intro_3(s,p):
    s.fill((26,10,42))
    pygame.draw.ellipse(s,(200,200,200),(W//2-60,120,120,160))
    _cs_text_anim(s,"INSETO! Voce pagara!",W//2,60,RED,22,p)
def draw_intro_4(s,p):
    s.fill((10,10,26));sz=int(30+p*40)
    pygame.draw.ellipse(s,(139,34,82),(W//2-sz,H//2-int(sz*0.9),sz*2,int(sz*1.8)))
    if p>0.6: txt(s,"Baron Von Beet nasceu!",W//2,H-40,YELLOW,20,True,True)

def draw_post_0(s,p):
    s.fill((26,10,10))
    txt(s,"A fazenda foi destruida...",W//2,80,WHITE,20,True,True)
def draw_post_1(s,p):
    s.fill((10,10,26))
    if p>0.5: txt(s,"Minha hora vai chegar!",W//2,H//2+80,GOLD,22,True,True)

CS_DATA={'intro':{'draws':[draw_intro_0,draw_intro_1,draw_intro_2,draw_intro_3,draw_intro_4],'durs':[2500,2000,2500,3000,2500]},
         'post':{'draws':[draw_post_0,draw_post_1],'durs':[3000,2500]}}

def start_cs(name,nxt):
    global cs,cs_nxt; cs_nxt=nxt
    d=CS_DATA[name]; cs={'idx':0,'t':0,'draws':d['draws'],'durs':d['durs']}
def u_cutscene(dt):
    global cs
    if not cs: return
    cs['t']+=dt
    if jp(pygame.K_RETURN) or jp(pygame.K_SPACE): cs=None; fade_to(cs_nxt); return
    if cs['t']>=cs['durs'][cs['idx']]:
        cs['idx']+=1; cs['t']=0
        if cs['idx']>=len(cs['draws']): cs=None; fade_to(cs_nxt)
def d_cutscene(surf):
    if not cs or cs['idx']>=len(cs['draws']): return
    prog=clamp(cs['t']/cs['durs'][cs['idx']],0,1)
    cs['draws'][cs['idx']](surf,prog)
    txt(surf,"ENTER pular",W//2,H-15,GRAY,11,True,True)

# ═══ TRANSITION SYSTEM ═════════════════════════════════════
def start_trans(sec):
    global ts,players
    ts={'type':sec,'phase':0,'t':0,'progress':0,'px':W//2,'py':H-80,'php':3,
        'entities':[],'warnings':[],'mini_boss':None,'lss':0,'countdown':5000}
    players=[mk_p(0)];eB.clear();pB.clear();particles.clear()
    go_st('trans')


def u_trans(dt):
    ts['t']+=dt; P=players[0]
    if ts['type']==0: u_trans_plat(dt,P)
    elif ts['type']==1: u_trans_shmup(dt,P)
    else: u_trans_gaunt(dt,P)
    u_pts(dt)

def u_trans_plat(dt,P):
    if ts.get('countdown',0)>0:
        ts['countdown']-=dt;P['y']=GND-P['h'];P['vy']=0;P['gnd']=True;P['jc']=0
        mx=0
        if keys.get(P['binds']['left']):mx=-1;P['face']=-1
        if keys.get(P['binds']['right']):mx=1;P['face']=1
        P['x']+=mx*P['spd'];P['x']=wrap_x(P['x'])
        return
    ts['progress']+=dt*(0.008+ts['t']*0.000003)
    if ts['progress']>=100:fade_to('shop');return
    spd=2+ts['t']*0.0005
    for e in ts['entities'][:]:e['y']+=spd
    ts['entities']=[e for e in ts['entities'] if e['y']<H+20]
    if int(ts['t'])%max(400,int(1200-ts['t']*0.5))<int(dt)+1:
        ts['entities'].append({'x':rng(60,W-60),'y':-20,'w':rng(60,120),'h':14,'rock':False})
    for w in ts['warnings'][:]:
        w['t']+=dt
        if w['t']>600:ts['entities'].append({'x':w['x'],'y':-30,'w':30,'h':20,'rock':True});ts['warnings'].remove(w)
    if int(ts['t'])%max(600,int(2000-ts['t']*0.8))<int(dt)+1:ts['warnings'].append({'x':rng(80,W-80),'t':0})
    P['vy']+=0.55;P['y']+=P['vy']
    on_p=False
    for e in ts['entities']:
        if not e['rock'] and P['x']+P['w']>e['x'] and P['x']<e['x']+e['w'] and P['y']+P['h']>=e['y'] and P['y']+P['h']<=e['y']+14 and P['vy']>=0:
            P['y']=e['y']-P['h'];P['vy']=0;P['gnd']=True;P['jc']=0;on_p=True
    if not on_p:P['gnd']=False
    if P['y']>H+50:P['hp']-=1;P['y']=H-100;P['vy']=-8
    if P['hp']<=0:fade_to('over');return
    mx=0
    if keys.get(P['binds']['left']):mx=-1;P['face']=-1
    if keys.get(P['binds']['right']):mx=1;P['face']=1
    P['x']+=mx*P['spd'];P['x']=wrap_x(P['x'])
    if jp(P['binds']['jump']) and P['jc']<2:P['vy']=-CFG['pJS'];P['jc']+=1
    for e in ts['entities']:
        if e['rock'] and hit_cr(P['x']+16,P['y']+22,15,e['x'],e['y'],e['w'],e['h']):
            if ts['php']>0 and P['inv']<=0:ts['php']-=1;P['inv']=1000;shake=10
            if ts['php']<=0:fade_to('over');return

def u_trans_shmup(dt,P):
    spd=3.5
    if keys.get(CTRLS[0]['left']): ts['px']-=spd
    if keys.get(CTRLS[0]['right']): ts['px']+=spd
    if keys.get(CTRLS[0]['jump']): ts['py']-=spd
    if keys.get(CTRLS[0]['dash']): ts['py']+=spd
    ts['px']=clamp(ts['px'],30,W-30);ts['py']=clamp(ts['py'],30,H-30)
    if ts['phase']==0:
        ts['progress']+=dt*0.02
        if ts['progress']>=100: ts['phase']=1;ts['progress']=0;ts['mini_boss']={'x':W-150,'y':H//2,'hp':120,'mhp':120,'phase':0,'w':50,'h':40,'t':0}
    if ts['phase']>=1:
        mb=ts['mini_boss']
        if mb and mb['hp']>0:
            mb['t']+=dt
            dx=ts['px']-mb['x'];dy=ts['py']-mb['y'];d=math.hypot(dx,dy) or 1
            mb['x']+=(dx/d)*(2+mb['phase']);mb['y']+=(dy/d)*(2+mb['phase'])
            mb['y']=clamp(mb['y'],50,H-50)
            if mb['t']>max(500,1500-mb['phase']*300):
                mb['t']=0;ang=math.atan2(ts['py']-mb['y'],ts['px']-mb['x'])
                for i in range(3):a=ang+(i-1)*0.4;add_eb(mb['x'],mb['y'],math.cos(a)*(4+mb['phase']),math.sin(a)*(4+mb['phase']),8,RED,3000)
                if mb['phase']>=1:
                    for _ in range(5):a=rng(0,TAU);add_eb(mb['x'],mb['y'],math.cos(a)*3,math.sin(a)*3,6,(255,138,128),2500)
            if hit_cr(ts['px'],ts['py'],20,mb['x'],mb['y'],mb['w'],mb['h']):
                if P['inv']<=0: ts['php']-=1;P['inv']=1000;shake=15
                if ts['php']<=0: fade_to('over'); return
    if jp(CTRLS[0]['shoot']):
        now=pygame.time.get_ticks()
        if now-ts['lss']>200: ts['lss']=now;pB.append({'x':ts['px'],'y':ts['py']-15,'vx':0,'vy':-8,'ext':'pea','life':2000,'sx':ts['px'],'ret':False,'expl':False,'ang':0,'hitC':0,'hitCD':0,'elap':0,'gid':0,'hit':False,'pid':0})
    for b in pB[:]:
        b['x']+=b['vx'];b['y']+=b['vy'];b['life']-=dt
        mb=ts.get('mini_boss')
        if ts['phase']>=1 and mb and mb['hp']>0 and hit_cr(b['x'],b['y'],12,mb['x'],mb['y'],mb['w'],mb['h']):
            mb['hp']-=2;burst(b['x'],b['y'],5,GREEN,1,3,2,4,250);b['life']=0
            if mb['hp']<=0:
                mb['hp']=0;ts['phase']=2;burst(mb['x'],mb['y'],30,ORANGE,2,7,3,9,800)
                sched.append({'time':pygame.time.get_ticks()+1500,'fn':lambda:fade_to('shop')})
        if b['life']<=0: pB.remove(b)
    for b in eB[:]:
        b['x']+=b['vx'];b['y']+=b['vy'];b['life']-=dt
        if hit_cr(ts['px'],ts['py'],12,b['x'],b['y'],0,0):
            ts['php']-=1;P['inv']=1000;shake=10;eB.remove(b)
            if ts['php']<=0: fade_to('over'); return
            continue
        if b['life']<=0 or b['y']>H+20 or b['y']<-20: eB.remove(b)

def u_trans_gaunt(dt,P):
    ts['progress']+=dt*0.015
    if ts['progress']>=100:
        global bossI; bossI=15; fade_to('fight',start_fight); return
    if int(ts['t'])%max(200,int(1000-ts['t']*0.3))<int(dt)+1:
        sd=random.randint(0,3)
        if sd==0: add_eb(rng(50,W-50),-10,rng(-1,1),rng(3,6),8,RED,4000)
        elif sd==1: add_eb(rng(50,W-50),H+10,rng(-1,1),-rng(3,6),8,(255,145,0),4000)
        elif sd==2: add_eb(-10,rng(50,H-50),rng(3,6),rng(-1,1),8,CYAN,4000)
        else: add_eb(W+10,rng(50,H-50),-rng(3,6),rng(-1,1),8,(213,0,249),4000)
    u_player(P,dt)
    for b in eB[:]:
        b['x']+=b['vx'];b['y']+=b['vy'];b['life']-=dt
        if hit_cr(P['x']+16,P['y']+22,b['sz']+2,b['x'],b['y'],0,0):
            hit_p(P);eB.remove(b);continue
        if b['life']<=0 or abs(b['x'])>W+20 or abs(b['y'])>H+20: eB.remove(b)
    if not P['alive']: fade_to('over')

def d_trans(surf):
    sec=ts['type']
    bg=BG_GRAD[min(sec,3) if sec<3 else 3]
    draw_grad(surf,(0,0,W,H),bg[0],bg[1])
    if ts['type']==0: d_trans_plat(surf)
    elif ts['type']==1: d_trans_shmup(surf)
    else: d_trans_gaunt_draw(surf)
    d_pts(surf)

def d_trans_plat(surf):
    pygame.draw.rect(surf,(42,31,21),(0,GND,W,H-GND))
    pygame.draw.line(surf,(74,58,37),(0,GND),(W,GND),2)
    for e in ts['entities']:
        c=(141,110,99) if e.get('rock') else (93,64,55)
        pygame.draw.rect(surf,c,(int(e['x']),int(e['y']),int(e['w']),int(e['h'])))
    for w in ts['warnings']:
        a=abs(math.sin(w['t']*0.01))*0.7+0.3
        as2=pygame.Surface((W,H),pygame.SRCALPHA)
        pygame.draw.polygon(as2,(255,23,68,int(a*255)),[(w['x'],30),(w['x']-12,10),(w['x']+12,10)])
        txt(as2,"!",w['x'],16,WHITE,10,True,True);surf.blit(as2,(0,0))
    if players:d_player(surf,players[0])
    cd=ts.get('countdown',0)
    if cd>0:
        s2=pygame.Surface((W,H),pygame.SRCALPHA);s2.fill((0,0,0,100));surf.blit(s2,(0,0))
        count=math.ceil(cd/1000)
        txt(surf,str(count),W//2,H//2-40,GOLD,80,True,True)
        txt(surf,"Preparar-se!",W//2,H//2+20,WHITE,20,True,True)
        txt(surf,"Mova-se com A/D",W//2,H//2+50,GRAY,14,True,True)
    else:
        pygame.draw.rect(surf,GOLD,(10,10,int(ts['progress']*3.8),8))
        pygame.draw.rect(surf,WHITE,(10,10,380,8),1)
        txt(surf,f"SUBINDO: {int(ts['progress'])}%",W//2,28,WHITE,10,True,True)

def d_trans_shmup(surf):
    sx,sy=int(ts['px']),int(ts['py'])
    pygame.draw.ellipse(surf,ORANGE,(sx-18,sy-12,36,24))
    pygame.draw.ellipse(surf,(21,101,192),(sx-18,sy-12,36,24),2)
    pygame.draw.polygon(surf,(255,214,0),[(sx,sy-20),(sx-15,sy),(sx+15,sy)])
    mb=ts.get('mini_boss')
    if ts['phase']>=1 and mb and mb['hp']>0:
        pygame.draw.ellipse(surf,RED,(int(mb['x']-mb['w']//2),int(mb['y']-mb['h']//2),mb['w'],mb['h']))
        pygame.draw.ellipse(surf,DKRED,(int(mb['x']-mb['w']//2),int(mb['y']-mb['h']//2),mb['w'],mb['h']),2)
        bw=120;pygame.draw.rect(surf,(0,0,0,128),(int(mb['x'])-bw//2-1,int(mb['y'])-31,bw+2,12))
        pygame.draw.rect(surf,RED,(int(mb['x'])-bw//2,int(mb['y'])-30,max(0,int(mb['hp']/mb['mhp']*bw)),10))
    for b in eB: pygame.draw.circle(surf,b['c'],(int(b['x']),int(b['y'])),int(b['sz']))
    for b in pB: pygame.draw.circle(surf,GREEN,(int(b['x']),int(b['y'])),4)
    txt(surf,"HP:",10,H-10,WHITE,10,True)
    for i in range(3):
        c=RED if i<ts['php'] else DGREY
        txt(surf,"\u2665",40+i*20,H-8,c,16,True)
    if ts['phase']==0:
        pygame.draw.rect(surf,GOLD,(10,10,int(ts['progress']*3.8),8))
        pygame.draw.rect(surf,WHITE,(10,10,380,8),1)
        txt(surf,f"Voo: {int(ts['progress'])}%",W//2,28,WHITE,10,True,True)

def d_trans_gaunt_draw(surf):
    pygame.draw.rect(surf,(42,31,21),(0,GND,W,H-GND))
    if players: d_player(surf,players[0])
    for b in eB:
        pygame.draw.circle(surf,b['c'],(int(b['x']),int(b['y'])),int(b['sz']))
    pygame.draw.rect(surf,GOLD,(10,10,int(ts['progress']*3.8),8))
    pygame.draw.rect(surf,WHITE,(10,10,380,8),1)
    txt(surf,f"DESAFIO FINAL: {int(ts['progress'])}%",W//2,28,WHITE,10,True,True)
    if players:
        for i in range(players[0]['mhp']):
            c=RED if i<players[0]['hp'] else DGREY
            txt(surf,"\u2665",16+i*22,60,c,18,True)

# ═══ BOSS DRAWING ═════════════════════════════════════════
def _bbase(s,cx,cy,w,h,c,out=BLACK,lw=3):
    pygame.draw.ellipse(s,c,(cx-w//2,cy-h//2,w,h))
    if out: pygame.draw.ellipse(s,out,(cx-w//2,cy-h//2,w,h),lw)
def _beyes(s,cx,cy,sz=4,c=WHITE,pup=BLACK,sp=10,oy=-8):
    for dx in(-sp,sp):
        pygame.draw.circle(s,c,(cx+dx,cy+oy),sz)
        pygame.draw.circle(s,pup,(cx+dx,cy+oy),max(1,sz//2))
def _bcrown(s,cx,cy,w,c=GOLD):
    pts=[(cx-w//2,cy),(cx-w//3,cy-15),(cx,cy-5),(cx+w//3,cy-15),(cx+w//2,cy)]
    pygame.draw.polygon(s,c,pts);pygame.draw.polygon(s,BLACK,pts,2)

def draw_boss(surf):
    if ph_tr['st']=='wait':
        is_final=int(boss['phase'])>=boss['maxPh']
        if is_final:
            if math.sin(ph_tr['t']*0.006)>0:
                s2=pygame.Surface((W,H),pygame.SRCALPHA);s2.fill((0,0,0,80));surf.blit(s2,(0,0))
                txt(surf,"FASE FINAL...",W//2,H//2-18,RED,36,True,True)
            return
        else:
            flash=int(abs(math.sin(ph_tr['t']*0.012))*80)+20
            storm=pygame.Surface((boss['w']+60,boss['h']+60),pygame.SRCALPHA)
            pygame.draw.ellipse(storm,(100,100,120,flash),(0,0,boss['w']+60,boss['h']+60))
            surf.blit(storm,(boss['x']-30,boss['y']-30))
            txt(surf,f"FASE {int(boss['phase'])+2}",W//2,30,GOLD,24,True,True)
            return
    if ph_tr['st']=='up':
        is_final=int(boss['phase'])>=boss['maxPh']
        if not is_final:
            flash=int(abs(math.sin(ph_tr['t']*0.012))*60)+10
            storm=pygame.Surface((boss['w']+40,boss['h']+40),pygame.SRCALPHA)
            pygame.draw.ellipse(storm,(100,100,120,flash),(0,0,boss['w']+40,boss['h']+40))
            surf.blit(storm,(boss['x']-20,boss['y']-20))
    if not boss or not boss['alive']:return
    idx=boss['idx'];cx=boss['x']+boss['w']//2;cy=boss['y']+boss['h']//2
    bob=math.sin(b_anim*0.003)*4;fl=boss['fl']>0;p2=boss['phase']>=1
    ph=boss['phase'];bw=boss['w'];bh=boss['h']
    if ph>=1:
        as2=pygame.Surface((bw+40,bh+30),pygame.SRCALPHA)
        pygame.draw.ellipse(as2,(255,50,50,20+ph*5),(0,0,bw+40,bh+30))
        surf.blit(as2,(cx-(bw+40)//2,cy-(bh+30)//2+bob))
    # Status effect visual overlay
    st=boss.get('status',{})
    if st.get('blackflame',False):
        bf_s=pygame.Surface((bw+20,bh+20),pygame.SRCALPHA)
        pygame.draw.ellipse(bf_s,(50,0,50,60+int(abs(math.sin(b_anim*0.01))*40)),(0,0,bw+20,bh+20))
        surf.blit(bf_s,(cx-(bw+20)//2,cy-(bh+20)//2+bob))
    elif st.get('purg_time',0)>0:
        pg_s=pygame.Surface((bw+10,bh+10),pygame.SRCALPHA)
        pygame.draw.ellipse(pg_s,(150,0,150,40),(0,0,bw+10,bh+10))
        surf.blit(pg_s,(cx-(bw+10)//2,cy-(bh+10)//2+bob))
    elif st.get('burn_time',0)>0:
        bn_s=pygame.Surface((bw+10,bh+10),pygame.SRCALPHA)
        pygame.draw.ellipse(bn_s,(255,100,0,40),(0,0,bw+10,bh+10))
        surf.blit(bn_s,(cx-(bw+10)//2,cy-(bh+10)//2+bob))
    if st.get('poison_time',0)>0:
        for _ in range(2):
            px2=cx+random.randint(-bw//3,bw//3);py2=cy+random.randint(-bh//3,bh//3)
            pygame.draw.circle(surf,(0,180,0),(px2,py2+bob),2)
    if st.get('bleed_time',0)>0:
        for _ in range(2):
            px2=cx+random.randint(-bw//3,bw//3);py2=cy+bh//3+random.randint(0,10)
            pygame.draw.circle(surf,(200,0,0),(px2,py2+bob),2)
    fc=WHITE if fl else None
    if idx==0:_dbeet(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==1:_dtwins(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==2:_dmush(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==3:_djaw(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==4:_dshadow(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==5:_dyeti(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==6:_dgolem(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==7:_deagle(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==8:_dwrym(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==9:_dphoenix(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==10:_dserpent(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==11:_dstar(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==12:_ddjinn(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==13:_dlevi(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==14:_dsolar(surf,cx,cy+bob,fc,p2,bw,bh)
    elif idx==15:_dunknown(surf,cx,cy+bob,fc,p2,bw,bh,ph)
    bw2=260;bx2=W//2-bw2//2;by2=44
    pygame.draw.rect(surf,BLACK,(bx2-2,by2-2,bw2+4,20))
    pygame.draw.rect(surf,GOLD,(bx2-2,by2-2,bw2+4,20),2)
    hpw=max(0,boss['hp']/boss['mhp']*bw2)
    pygame.draw.rect(surf,RED,(bx2,by2,int(hpw),16))
    txt(surf,f"{boss['n']} P{int(boss['phase'])+1}/{boss['maxPh']+1}",W//2,by2-14,GOLD,12,True,True)
    if b_atk['st']=='windup':txt(surf,"!",W-bx2,by2+2,RED,9,True,True)
    # Status effect icons near HP bar
    sx2=bx2;sy2=by2+22
    st=boss.get('status',{})
    if st.get('burn_time',0)>0:txt(surf,"BRN",sx2,sy2,ORANGE,9,True);sx2+=28
    if st.get('purg_time',0)>0:txt(surf,f"PRGx{st['purg_stacks']}",sx2,sy2,PURPLE,9,True);sx2+=38
    if st.get('blackflame',False):txt(surf,"DARK",sx2,sy2,(80,0,80),9,True);sx2+=32
    if st.get('frio_stacks',0)>0:
        fr_a=min(80,st.get('frio_stacks',0)*8)
        fr_s=pygame.Surface((bw+10,bh+10),pygame.SRCALPHA)
        pygame.draw.ellipse(fr_s,(0,150,255,fr_a),(0,0,bw+10,bh+10))
        surf.blit(fr_s,(cx-(bw+10)//2,cy-(bh+10)//2+bob))
    if st.get('gelo_ardente',False):
        ga_s=pygame.Surface((bw+16,bh+16),pygame.SRCALPHA)
        pulse=int(abs(math.sin(b_anim*0.006))*40)+20
        pygame.draw.ellipse(ga_s,(0,200,255,pulse),(0,0,bw+16,bh+16))
        surf.blit(ga_s,(cx-(bw+16)//2,cy-(bh+16)//2+bob))
    if st.get('filming',False):
        cam_x=boss['x']+boss['w']//2;cam_y=boss['y']-20
        pygame.draw.rect(surf,(100,200,255),(cam_x-5,cam_y-3,10,6))
        pygame.draw.circle(surf,(100,200,255),(cam_x,cam_y),4)
        pygame.draw.circle(surf,BLACK,(cam_x,cam_y),4,1)
    if st.get('poison_time',0)>0:txt(surf,f"PSNx{st['poison_stacks']}",sx2,sy2,(0,200,0),9,True);sx2+=38
    if st.get('bleed_time',0)>0:txt(surf,"BLD",sx2,sy2,RED,9,True);sx2+=28
        # Stun visual
    if boss.get('_stun_time',0)>0:
        stun_s=pygame.Surface((bw+20,bh+20),pygame.SRCALPHA)
        pulse=int(abs(math.sin(b_anim*0.02))*80)+40
        pygame.draw.ellipse(stun_s,(255,255,0,pulse),(0,0,bw+20,bh+20))
        surf.blit(stun_s,(cx-(bw+20)//2,cy-(bh+20)//2+bob))
        txt(surf,"STUN",cx,cy-bh//2-10+bob,YELLOW,10,True,True)
    # Frozen visual
    if boss.get('_frozen',False):
        frz_s=pygame.Surface((bw+10,bh+10),pygame.SRCALPHA)
        pygame.draw.ellipse(frz_s,(100,200,255,100),(0,0,bw+10,bh+10))
        surf.blit(frz_s,(cx-(bw+10)//2,cy-(bh+10)//2+bob))
        txt(surf,"CONGELADO",cx,cy-bh//2-10+bob,CYAN,10,True,True)
    if st.get('hemorrhage_time',0)>0:txt(surf,"HEM",sx2,sy2,(200,0,0),9,True);sx2+=28
    if st.get('nail_stacks',0)>0:txt(surf,f"NAILx{st['nail_stacks']}",sx2,sy2,(160,82,45),9,True);sx2+=42
    if st.get('irritated',False):txt(surf,"IRRIT!",sx2,sy2,RED,9,True)
    if st.get('frio_stacks',0)>0 and not st.get('gelo_ardente',False):
        txt(surf,f"FRIOx{st['frio_stacks']}",sx2,sy2,CYAN,9,True);sx2+=42
    if st.get('gelo_ardente',False):
        txt(surf,"G.ARDO",sx2,sy2,(0,200,255),9,True);sx2+=38
    if st.get('picancia_stacks',0)>0:
        txt(surf,f"PICx{st['picancia_stacks']}",sx2,sy2,(200,50,0),9,True);sx2+=38
    if st.get('abismo',False):
        txt(surf,"ABISMO",sx2,sy2,(200,0,0),9,True);sx2+=38
    if st.get('filming',False):
        sec=math.ceil(st.get('film_time',0)/1000)
        txt(surf,f"FILM {sec}s",sx2,sy2,(100,200,255),9,True);sx2+=48
    if st.get('mask_attached',False):
        txt(surf,f"MASKx{st['mask_loucura']}",sx2,sy2,(180,180,200),9,True)


# ── Individual boss renderers ───────────────────────────
def _dbeet(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((93,16,73) if p2 else (139,34,82))
    _bbase(s,cx,cy,bw,bh,c)
    _bcrown(s,cx,cy-bh//2+5,30,RED if p2 else GOLD)
    _beyes(s,cx,cy,5,RED if p2 else WHITE,BLACK,10,-8)
    pygame.draw.line(s,BLACK,(cx-18,cy-22),(cx-4,cy-14),3)
    pygame.draw.line(s,BLACK,(cx+18,cy-22),(cx+4,cy-14),3)
    pygame.draw.arc(s,BLACK,(cx-10,cy+4,20,12),3.14,6.28,2)
    for i in range(3):
        rx=cx-15+i*15; sw=math.sin(b_anim*0.002+i*1.5)*5
        pygame.draw.line(s,(80,30,50),(rx,cy+bh//2-5),(int(rx+sw),cy+bh//2+10),2)

def _dtwins(s,cx,cy,fc,p2,bw,bh):
    for i,dx in enumerate((-20,20)):
        c2=fc or ((183,28,28) if p2 and i==1 else (218,165,32))
        pygame.draw.circle(s,c2,(cx+dx,cy),22)
        pygame.draw.circle(s,BLACK,(cx+dx,cy),22,2)
        ang=(b_anim*0.002*(i+1))%TAU
        hx2=cx+dx+int(math.cos(ang)*15)
        hy2=cy+int(math.sin(ang)*15)
        pygame.draw.line(s,BLACK,(cx+dx,cy),(hx2,hy2),2)
        pygame.draw.circle(s,BLACK,(cx+dx,cy),3)
        for j in range(4):
            a2=TAU/4*j
            pygame.draw.circle(s,BLACK,(cx+dx+int(math.cos(a2)*18),cy+int(math.sin(a2)*18)),2)
    pygame.draw.line(s,(100,100,100),(cx-2,cy),(cx+2,cy),3)

def _dmush(s,cx,cy,fc,p2,bw,bh):
    cc=fc or ((136,14,79) if p2 else (198,40,40))
    pygame.draw.ellipse(s,cc,(cx-bw//2,cy-bh//4,bw,bh//2))
    pygame.draw.ellipse(s,BLACK,(cx-bw//2,cy-bh//4,bw,bh//2),2)
    dots=[(-15,-10),(0,-15),(15,-10),(-8,5),(8,5)]
    dc=(225,190,231) if p2 else WHITE
    for dx2,dy2 in dots: pygame.draw.circle(s,dc,(cx+dx2,cy-bh//8+dy2),4)
    pygame.draw.rect(s,(200,200,180),(cx-10,cy+bh//4,20,bh//4))
    pygame.draw.rect(s,BLACK,(cx-10,cy+bh//4,20,bh//4),2)
    for dx2 in (-6,6): pygame.draw.circle(s,BLACK,(cx+dx2,cy+bh//4+8),3)

def _djaw(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((207,216,220) if p2 else (84,110,122))
    pygame.draw.rect(s,c,(cx-bw//2,cy-bh//2,bw,bh))
    pygame.draw.rect(s,BLACK,(cx-bw//2,cy-bh//2,bw,bh),3)
    for i in range(7):
        tx2=cx-bw//2+10+i*(bw-20)//6
        pygame.draw.polygon(s,WHITE,[(tx2,cy+bh//2),(tx2-4,cy+bh//2+12),(tx2+4,cy+bh//2+12)])
    for dx2 in (-15,15): pygame.draw.circle(s,RED,(cx+dx2,cy-8),5)
    for i in range(4):
        rx2=cx-bw//2+15+i*((bw-30)//3)
        pygame.draw.circle(s,BLACK,(rx2,cy),3)

def _dshadow(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((224,64,251) if p2 else (74,20,140))
    pts=[(cx,cy-bh//2),(cx-bw//2,cy),(cx-bw//3,cy+bh//2),(cx+bw//3,cy+bh//2),(cx+bw//2,cy)]
    pygame.draw.polygon(s,c,pts)
    pygame.draw.polygon(s,BLACK,pts,2)
    _bcrown(s,cx,cy-bh//2+5,24,(224,64,251) if p2 else GOLD)
    gc=(224,64,251) if p2 else (156,39,176)
    for dx2 in (-8,8): pygame.draw.circle(s,gc,(cx+dx2,cy-10),5)
    cv=abs(math.sin(b_anim*0.003))*8
    pygame.draw.line(s,c,(cx-bw//2,cy+5),(cx-bw//2-int(cv),cy+bh//2+10),2)
    pygame.draw.line(s,c,(cx+bw//2,cy+5),(cx+bw//2+int(cv),cy+bh//2+10),2)

def _dyeti(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((227,242,253) if p2 else (179,229,252))
    _bbase(s,cx,cy,bw,bh,c)
    _beyes(s,cx,cy,5,(100,181,246),BLACK,12,-10)
    for dx2 in (-25,25):
        pts=[(cx+dx2,cy-15),(cx+dx2-8,cy-35),(cx+dx2+8,cy-35)]
        pygame.draw.polygon(s,(100,181,246) if p2 else (144,202,249),pts)
    pygame.draw.arc(s,BLACK,(cx-10,cy+5,20,10),3.14,6.28,2)

def _dgolem(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((161,136,127) if p2 else (121,85,72))
    pygame.draw.rect(s,c,(cx-bw//2,cy-bh//2,bw,bh))
    pygame.draw.rect(s,BLACK,(cx-bw//2,cy-bh//2,bw,bh),3)
    gc=(255,87,34) if p2 else (255,215,0)
    for i in range(4):
        x1=cx-bw//4+i*bw//6; y1=cy-bh//4
        pygame.draw.line(s,gc,(x1,y1),(x1+bw//8,y1+bh//4),2)
    _beyes(s,cx,cy-5,3,gc,BLACK,12,-5)
    pygame.draw.rect(s,(93,64,55),(cx-bw//2-5,cy-bh//2,10,15))
    pygame.draw.rect(s,(93,64,55),(cx+bw//2-5,cy-bh//2,10,15))

def _deagle(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((255,241,118) if p2 else (255,213,79))
    _bbase(s,cx,cy,bw,bh,c)
    flap=int(math.sin(b_anim*0.005)*10)
    pygame.draw.polygon(s,(245,127,23),[(cx-30,cy-10+flap),(cx-45,cy-30+flap),(cx-15,cy-15+flap)])
    pygame.draw.polygon(s,(245,127,23),[(cx+30,cy-10-flap),(cx+45,cy-30-flap),(cx+15,cy-15-flap)])
    _beyes(s,cx,cy,4,BLACK,8,-5)
    pygame.draw.polygon(s,(255,152,0),[(cx,cy+2),(cx-6,cy+12),(cx+6,cy+12)])
    if p2:
        for i in range(3):
            a2=b_anim*0.008+i*2
            lx=cx+int(math.cos(a2)*35); ly=cy+int(math.sin(a2)*25)
            pygame.draw.line(s,YELLOW,(lx,ly),(lx+random.randint(-5,5),ly+random.randint(8,15)),2)

def _dwrym(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((255,87,34) if p2 else (230,74,25))
    _bbase(s,cx,cy,bw,bh,c)
    for dx2 in (-20,20):
        pygame.draw.polygon(s,(198,40,40),[(cx+dx2,cy-bh//2),(cx+dx2-6,cy-bh//2-20),(cx+dx2+6,cy-bh//2-20)])
    _beyes(s,cx,cy,5,(255,171,0),BLACK,15,-10)
    for i in range(5):
        lx=cx-bw//3+i*(bw//6); ly=cy-5+int(math.sin(b_anim*0.003+i)*8)
        pygame.draw.circle(s,(255,171,0),(lx,ly),3)

def _dphoenix(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((100,181,246) if p2 else (255,111,0))
    _bbase(s,cx,cy,bw,bh,c)
    pygame.draw.polygon(s,(255,214,0),[(cx,cy-40),(cx-20,cy-10),(cx+20,cy-10)])
    for i in range(5):
        a2=b_anim*0.004+i*1.2
        tx2=cx+int(math.cos(a2)*25); ty2=cy+bh//2+10+int(math.sin(a2*2)*5+i*3)
        c2=(100,181,246) if p2 else (255,152,0)
        pygame.draw.circle(s,c2,(tx2,ty2),3)
    _beyes(s,cx,cy-5,4,(255,255,200),BLACK,8,-5)
    pygame.draw.polygon(s,(255,214,0),[(cx,cy-35),(cx-8,cy-20),(cx+8,cy-20)])

def _dserpent(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((21,101,192) if p2 else (100,181,246))
    pts=[]
    for i in range(8):
        t2=i/7; px2=cx-bw//2+int(t2*bw)
        py2=cy+int(math.sin(b_anim*0.003+t2*4)*15)
        pts.append((px2,py2))
    if len(pts)>=2: pygame.draw.lines(s,c,False,pts,6)
    head=pts[-1] if pts else (cx,cy)
    pygame.draw.circle(s,c,(head[0],head[1]),15)
    pygame.draw.circle(s,BLACK,(head[0],head[1]),15,2)
    pygame.draw.circle(s,BLACK,(head[0]-5,head[1]-4),3)
    pygame.draw.circle(s,BLACK,(head[0]+5,head[1]-4),3)

def _dstar(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((126,87,194) if p2 else (94,53,177))
    _bbase(s,cx,cy,bw,bh,c)
    sc=WHITE if p2 else (206,147,216)
    for i in range(6):
        a2=b_anim*0.002+i*TAU/6
        pygame.draw.circle(s,sc,(cx+int(math.cos(a2)*(bw//2+15)),cy+int(math.sin(a2)*(bh//2+10))),4)
    _beyes(s,cx,cy-10,5,(206,147,216),BLACK,10,-5)
    for dx2 in (-15,0,15):
        pygame.draw.ellipse(s,(206,147,216),(cx+dx2-3,cy+5,6,10))

def _ddjinn(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((77,208,225) if p2 else (0,172,193))
    for i in range(8):
        t2=i/7; w2=int(bw//2*(1-t2*0.6))
        py2=cy+bh//4+int(t2*bh//2)
        sw=int(math.sin(b_anim*0.005+t2*3)*8)
        pygame.draw.line(s,c,(cx-w2+sw,py2),(cx+w2+sw,py2),3)
    pygame.draw.ellipse(s,c,(cx-12,cy-bh//2,24,25))
    pygame.draw.ellipse(s,BLACK,(cx-12,cy-bh//2,24,25),2)
    _bcrown(s,cx,cy-bh//2+3,16,(0,151,167))
    _beyes(s,cx,cy-bh//4,3,WHITE,BLACK,6,-2)

def _dlevi(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((144,202,249) if p2 else (100,181,246))
    _bbase(s,cx,cy,bw,bh,c)
    pygame.draw.ellipse(s,(69,160,230),(cx-bw//4-5,cy-5,20,30))
    pygame.draw.ellipse(s,(69,160,230),(cx+bw//4-15,cy-5,20,30))
    pygame.draw.circle(s,WHITE,(cx,cy-15),10)
    pygame.draw.circle(s,BLACK,(cx+2,cy-15),5)
    for i in range(6):
        bx2=cx-bw//3+random.randint(0,int(bw*0.66))
        by2=cy-bh//4+random.randint(0,int(bh*0.5))
        pygame.draw.circle(s,(80,130,180),(bx2,by2),3)

def _dsolar(s,cx,cy,fc,p2,bw,bh):
    c=fc or ((255,255,200) if p2 else GOLD)
    corona_sz=bw//2+15+int(math.sin(b_anim*0.004)*5)
    for i in range(12):
        a2=TAU/12*i+b_anim*0.001
        pygame.draw.line(s,(255,179,0),(cx+int(math.cos(a2)*(bw//2-5)),cy+int(math.sin(a2)*(bh//2-5))),(cx+int(math.cos(a2)*corona_sz),cy+int(math.sin(a2)*corona_sz)),3)
    _bbase(s,cx,cy,bw,bh,c)
    pygame.draw.polygon(s,(255,214,0),[(cx,cy-bh//2-10),(cx-18,cy-10),(cx+18,cy-10)])
    _beyes(s,cx,cy-5,6,(255,255,200),BLACK,12,-8)

def _dunknown(s,cx,cy,fc,p2,bw,bh,ph):
    cols=[RED,(255,145,0),YELLOW,GREEN,CYAN,(213,0,249),(245,0,87),(255,109,0),(118,255,3),(0,229,255)]
    c=fc or cols[ph%10]
    n_sides=min(3+int(ph*0.7),12); rot=b_anim*0.002*(1+ph*0.2)
    pts=[]
    for i in range(n_sides):
        a2=TAU/n_sides*i+rot
        r2=bw//2+int(math.sin(b_anim*0.003+i)*5)
        pts.append((cx+int(math.cos(a2)*r2),cy+int(math.sin(a2)*r2)))
    if len(pts)>=3:
        pygame.draw.polygon(s,c,pts)
        pygame.draw.polygon(s,BLACK,pts,3)
    for i in range(2+ph):
        ex=cx-20+i*10; ey=cy-15+int(math.sin(i*1.5)*8)
        pygame.draw.circle(s,cols[(ph+i)%10],(ex,ey),3)

# ═══ BACKGROUND & HUD ═══════════════════════════════════
def draw_bg(surf):
    sec=BDATA[bossI]['s'] if bossI<len(BDATA) else 0
    bg=BG_GRAD[min(sec,3)];draw_grad(surf,(0,0,W,H),bg[0],bg[1])
    pygame.draw.rect(surf,(42,31,21),(0,GND,W,H-GND))
    pygame.draw.line(surf,(74,58,37),(0,GND),(W,GND),2)
    # atmospheric dots
    for i in range(15):
        px2=(i*137+bossI*53)%W;py2=(i*97+sec*41)%GND
        pygame.draw.circle(surf,(255,255,255),(px2,py2),1)

def draw_hud(surf):
    for pi2,p in enumerate(players):
        ox=pi2*(200 if num_players>=2 else 0)
        c2=GREEN if p['id']==0 else BLUE
        txt(surf,f"P{p['id']+1}",16+ox,10,c2,9,True)
        for i in range(p['mhp']):
            c3=RED if i<p['hp'] else DGREY
            txt(surf,"\u2665",16+ox+i*22,22,c3,18,True)
        if not p['alive'] and num_players>=2:
            txt(surf,f"REV:{max(0,math.ceil((15000-p['deadT'])/1000))}s",16+ox,38,RED,8,True)
        w=WPNS[p['equipped']]
        pygame.draw.rect(surf,(0,0,0),(6+ox,H-32,150,26))
        txt(surf,w['n'],10+ox,H-18,w['c'],9,True)
    sec2=int(fTime//1000);mn=sec2//60
    tc=GREEN if sec2<240 else RED
    txt(surf,f"{mn}:{sec2%60:02d}",W-16,H-22,tc,14,True,right=True)
    txt(surf,f"{coins}",W-16,18,GOLD,14,True,right=True)
    # Piano HUD extras
    d_piano_passive_hud(surf)
    d_special_bar(surf)
    d_piano_variant_hud(surf)

def d_title(surf):
    surf.fill((11,11,32))
    for i in range(50):
        x2=int((i*137.5)%W); y2=int((i*97.3)%H)
        a=rng(0.15,0.6)
        as2=pygame.Surface((4,4),pygame.SRCALPHA)
        as2.fill((255,255,255,int(a*255)))
        surf.blit(as2,(x2,y2))
    txt(surf,"PIP'S BOSS RUSH",W//2+3,43,BLACK,48,True,True)
    txt(surf,"PIP'S BOSS RUSH",W//2,40,GOLD,48,True,True)
    txt(surf,"16 Bosses | 3 Secoes | 3 Transicoes",W//2,96,ORANGE,13,True,True)
    items=["JOGAR","CONTROLES"]
    for i,label in enumerate(items):
        y=175+i*55
        c2=GOLD if i==sh_sel else GRAY
        pre="> " if i==sh_sel else "   "
        txt(surf,pre+label,W//2,y,c2,22,True,True)
    txt(surf,"W/S + Enter",W//2,H-25,DGREY,11,True,True)

def d_savesel(surf):
    surf.fill((11,11,32))
    txt(surf,"ESCOLHA O SAVE",W//2,30,GOLD,28,True,True)
    for i in range(3):
        x=60+i*240; y=65; w=210; h=340; sel=(i==save_sel); s=saves_data[i]
        bg=(30,30,74) if sel else (14,14,34)
        bc=GOLD if sel else (34,34,34)
        lw=3 if sel else 1
        pygame.draw.rect(surf,bg,(x,y,w,h))
        pygame.draw.rect(surf,bc,(x,y,w,h),lw)
        txt(surf,f"SAVE {i+1}",x+w//2,y+22,WHITE,18,True,True)
        if s:
            txt(surf,f"Moedas: {s.get('coins',0)}",x+w//2,y+52,GREEN,12,True,True)
            cl=sum(1 for j in range(16) if s.get('bl',[0]*16)[j]) if s.get('bl') else 0
            txt(surf,f"Bosses: {cl}/16",x+w//2,y+72,GOLD,12,True,True)
            for j,sec in enumerate(SECS):
                sc2=0
                bl2=s.get('bl',[0]*16)
                for k in sec['bosses']:
                    if k<len(bl2) and bl2[k]: sc2+=1
                txt(surf,f"{sec['n']}: {sc2}/{len(sec['bosses'])}",x+w//2,y+95+j*18,sec['c'],10,True,True)
            txt(surf,"Del: Apagar",x+w//2,y+h-12,DGREY,10,True,True)
        else:
            txt(surf,"VAZIO",x+w//2,y+120,DGREY,20,True,True)
            txt(surf,"Novo Jogo",x+w//2,y+160,GREEN,12,True,True)
    txt(surf,"< > Enter | Del | ESC",W//2,H-12,GRAY,12,True,True)

def d_modeselect(surf):
    surf.fill((11,11,32))
    txt(surf,"MODO DE JOGO",W//2,35,GOLD,28,True,True)
    txt(surf,f"Save {cur_save+1} | Moedas: {coins}",W//2,58,GREEN,11,True,True)
    items=["1P","2P LOCAL","HOST LAN","CONECTAR LAN","VOLTAR"]
    for i,label in enumerate(items):
        y=90+i*45;c2=GOLD if i==mode_sel else GRAY
        pre="> " if i==mode_sel else"   "
        txt(surf,pre+label,W//2,y,c2,20,True,True)

def d_ctrlcfg(surf):
    surf.fill((8,8,24))
    txt(surf,"CONTROLES",W//2,25,GOLD,26,True,True)
    for p2 in range(2):
        c2=GOLD if p2==ctrl_p else(68,68,68)
        txt(surf,f"PLAYER {p2+1}",W//2-130+p2*180,55,c2,16,True,True)
    for a,label in enumerate(C_LABELS):
        y=85+a*40;sel=(a==ctrl_a)
        c2=WHITE if sel else(136,136,136)
        txt(surf,label,W//2-140,y,c2,14,True)
        if ctrl_r and sel:
            blink=">>> TECLA <<<" if(pygame.time.get_ticks()//300)%2 else""
            txt(surf,blink,W//2+170,y,GOLD,14,True,right=True)
        else:
            k=CTRLS[ctrl_p][C_ACTS[a]];kn=pygame.key.name(k).upper() if k else"?"
            txt(surf,kn,W//2+170,y,GOLD if sel else GREEN,14,True,right=True)
    txt(surf,"TAB Player | W/S Nav | Enter Remapear | ESC",W//2,H-18,(102,102,102),12,True,True)


# DEPOIS (cw=110, ch=90, 5 colunas, 3 linhas com scroll):
def d_shop(surf):
    surf.fill((11,11,32))
    txt(surf,"ARSENAL",W//2,4,GOLD,24,True,True)
    txt(surf,f"Save {cur_save+1} | Moedas: {coins} | P{local_pid+1}",W//2,24,(200,200,200),9,True,True)
    # ── Loadout bar ──
    lo_y=38
    txt(surf,"SLOT:",6,lo_y,GOLD,9,True)
    for s2 in range(3):
        lx=50+s2*110
        sel_slot=(s2==loadout_edit_slot)
        bc=GOLD if sel_slot else(80,80,80)
        pygame.draw.rect(surf,bc,(lx-2,lo_y-2,106,18),2 if sel_slot else 1)
        txt(surf,f"[{s2+1}]",lx,lo_y,GOLD if sel_slot else GRAY,8,True)
        if loadout[s2]>=0 and loadout[s2]<len(WPNS):
            w2=WPNS[loadout[s2]]
            _dwicon(surf,w2['tp'],lx+22,lo_y+3,w2['c'])
            txt(surf,w2['n'],lx+30,lo_y,w2['c'],7,True)
        else:
            txt(surf,"VAZIO",lx+30,lo_y,DGREY,7,True)
    # ── Armas ──
    cw=110;ch=78;gap=4;cols=5;rows=4
    sx=(W-(cols*cw+(cols-1)*gap))//2;sy=60
    for i,w in enumerate(WPNS):
        col=i%cols;row=i//cols
        x=sx+col*(cw+gap);y=sy+row*(ch+gap)
        if y+ch>H-10:continue
        sel=(i==sh_sel)
        in_loadout=(i in loadout)
        bg=(30,30,74) if sel else(25,25,50) if in_loadout else(18,18,34)
        bc=GOLD if sel else(70,70,30) if in_loadout else(51,51,51)
        pygame.draw.rect(surf,bg,(x,y,cw,ch))
        pygame.draw.rect(surf,bc,(x,y,cw,ch),3 if sel else 1)
        _dwicon(surf,w['tp'],x+16,y+20,w['c'])
        txt(surf,w['n'],x+28,y+6,WHITE,7,True)
        if w['own']:
            # Mostrar em qual slot
            for s2 in range(3):
                if loadout[s2]==i:
                    txt(surf,f"[{s2+1}]",x+cw-18,y+4,GOLD,7,True)
                    break
        if i==equipped[local_pid]:txt(surf,"ATIVA",x+4,y+ch-10,GREEN,7,True)
        elif w['own']:txt(surf,"COMPRADA",x+4,y+ch-10,BLUE,7,True)
        else:txt(surf,f"{w['cost']}moedas",x+4,y+ch-10,GOLD,7,True)
    txt(surf,"1/2/3:Slot | Enter:Equipar | Espaco:Boss | ESC:Voltar",W//2,H-6,(136,136,136),8,True,True)

# DEPOIS (13 armas):
def _dwicon(surf,tp,cx,cy,c):
    if tp=='pea':
        pygame.draw.polygon(surf,c,[(cx,cy-10),(cx+8,cy),(cx,cy+10),(cx-8,cy)])
        pygame.draw.polygon(surf,BLACK,[(cx,cy-10),(cx+8,cy),(cx,cy+10),(cx-8,cy)],1)
    elif tp=='boom':
        pygame.draw.polygon(surf,c,[(cx-9,cy-5),(cx,cy+3),(cx+9,cy-5),(cx,cy+7)])
        pygame.draw.polygon(surf,BLACK,[(cx-9,cy-5),(cx,cy+3),(cx+9,cy-5),(cx,cy+7)],1)
    elif tp=='tomato':
        pygame.draw.circle(surf,(220,20,60),(cx,cy),9)
        pygame.draw.circle(surf,(50,150,50),(cx,cy-6),4)
        pygame.draw.circle(surf,BLACK,(cx,cy),9,1)
        pygame.draw.line(surf,(30,120,30),(cx-3,cy-8),(cx+3,cy-8),2)
    elif tp=='mask':
        pygame.draw.ellipse(surf,(180,180,200),(cx-10,cy-12,20,24))
        pygame.draw.ellipse(surf,BLACK,(cx-10,cy-12,20,24),1)
        pygame.draw.line(surf,BLACK,(cx-5,cy-4),(cx-5,cy+2),2)
        pygame.draw.line(surf,BLACK,(cx+5,cy-4),(cx+5,cy+2),2)
        pygame.draw.arc(surf,BLACK,(cx-6,cy+2,12,8),3.14,6.28,2)
    elif tp=='shuriken':
        pts=[]
        for i in range(4):
            a=TAU/4*i-math.pi/4
            pts.append((cx+int(math.cos(a)*10),cy+int(math.sin(a)*10)))
            a2=a+TAU/8
            pts.append((cx+int(math.cos(a2)*4),cy+int(math.sin(a2)*4)))
        pygame.draw.polygon(surf,(192,192,192),pts)
        pygame.draw.polygon(surf,BLACK,pts,1)
        pygame.draw.circle(surf,BLACK,(cx,cy),2)
    elif tp=='mic':
        pygame.draw.rect(surf,(150,80,200),(cx-3,cy,6,14))
        pygame.draw.circle(surf,(200,100,255),(cx,cy-3),7)
        pygame.draw.circle(surf,BLACK,(cx,cy-3),7,1)
        for i in range(3):
            pygame.draw.arc(surf,BLACK,(cx-5+i*3,cy-5,4,4),0,3.14,1)
    elif tp=='pepper':
        pygame.draw.ellipse(surf,(200,0,0),(cx-6,cy-8,12,20))
        pygame.draw.ellipse(surf,BLACK,(cx-6,cy-8,12,20),1)
        pygame.draw.line(surf,(30,150,30),(cx,cy-8),(cx+3,cy-13),2)
        pygame.draw.line(surf,(30,150,30),(cx-3,cy-7),(cx-6,cy-12),2)
    elif tp=='camera':
        pygame.draw.rect(surf,(60,60,80),(cx-10,cy-7,20,14))
        pygame.draw.rect(surf,BLACK,(cx-10,cy-7,20,14),1)
        pygame.draw.circle(surf,(100,200,255),(cx,cy),5)
        pygame.draw.circle(surf,BLACK,(cx,cy),5,1)
        pygame.draw.circle(surf,WHITE,(cx+2,cy-2),2)
        pygame.draw.rect(surf,(80,80,100),(cx-3,cy-10,6,4))
    elif tp=='nail':
        pygame.draw.line(surf,(120,70,30),(cx-8,cy),(cx+8,cy),3)
        pygame.draw.polygon(surf,(160,82,45),[(cx+8,cy),(cx+13,cy-3),(cx+13,cy+3)])
        pygame.draw.rect(surf,(100,60,20),(cx-2,cy+3,4,8))
    elif tp=='shield':
        pygame.draw.polygon(surf,(70,130,180),[(cx,cy-12),(cx-10,cy-5),(cx-10,cy+10),(cx,cy+14),(cx+10,cy+10),(cx+10,cy-5)])
        pygame.draw.polygon(surf,BLACK,[(cx,cy-12),(cx-10,cy-5),(cx-10,cy+10),(cx,cy+14),(cx+10,cy+10),(cx+10,cy-5)],1)
        pygame.draw.line(surf,GOLD,(cx,cy-8),(cx,cy+8),2)
        pygame.draw.line(surf,GOLD,(cx-6,cy),(cx+6,cy),2)
    elif tp=='rod':
        pygame.draw.line(surf,(139,90,43),(cx-6,cy+10),(cx+6,cy-10),3)
        pygame.draw.line(surf,(0,150,136),(cx+6,cy-10),(cx+10,cy-14),2)
        pygame.draw.polygon(surf,(200,200,200),[(cx+10,cy-14),(cx+14,cy-17),(cx+10,cy-10)])
        pygame.draw.line(surf,(150,150,150),(cx+12,cy-17),(cx+12,cy-22),1)
    elif tp=='crown':
        pygame.draw.polygon(surf,GOLD,[(cx-10,cy+5),(cx-10,cy-5),(cx-6,cy),(cx,cy-8),(cx+6,cy),(cx+10,cy-5),(cx+10,cy+5)])
        pygame.draw.polygon(surf,BLACK,[(cx-10,cy+5),(cx-10,cy-5),(cx-6,cy),(cx,cy-8),(cx+6,cy),(cx+10,cy-5),(cx+10,cy+5)],1)
        pygame.draw.circle(surf,RED,(cx,cy-5),2)
    elif tp=='slots':
        pygame.draw.rect(surf,(200,0,100),(cx-10,cy-8,20,16))
        pygame.draw.rect(surf,BLACK,(cx-10,cy-8,20,16),1)
        for i in range(3):
            pygame.draw.rect(surf,WHITE,(cx-7+i*7,cy-5,5,10))
            pygame.draw.rect(surf,BLACK,(cx-7+i*7,cy-5,5,10),1)
        pygame.draw.circle(surf,GOLD,(cx,cy-10),2)
    elif tp=='spr':
        for dx in(-5,0,5):pygame.draw.circle(surf,c,(cx+dx,cy-4+(0 if dx else -3)),3)
    elif tp=='bolt':
        pygame.draw.line(surf,c,(cx-2,cy-10),(cx+3,cy-2),3)
        pygame.draw.line(surf,c,(cx+3,cy-2),(cx-1,cy),3)
        pygame.draw.line(surf,c,(cx-1,cy),(cx+4,cy+10),3)
    elif tp=='bomb':
        pygame.draw.circle(surf,(68,68,68),(cx,cy+2),9)
        pygame.draw.circle(surf,BLACK,(cx,cy+2),9,1)
        pygame.draw.circle(surf,RED,(cx,cy-9),3)
    elif tp=='firering':
        pygame.draw.circle(surf,ORANGE,(cx,cy),9)
        pygame.draw.circle(surf,YELLOW,(cx,cy),5)
        pygame.draw.circle(surf,BLACK,(cx,cy),9,1)
        for i in range(4):
            a=TAU/4*i
            pygame.draw.circle(surf,RED,(cx+int(math.cos(a)*12),cy+int(math.sin(a)*12)),2)
    elif tp=='home':
        pts=[(cx,cy-10),(cx+3,cy-3),(cx+10,cy),(cx+3,cy+3),(cx,cy+10),(cx-3,cy+3),(cx-10,cy),(cx-3,cy-3)]
        pygame.draw.polygon(surf,c,pts);pygame.draw.polygon(surf,BLACK,pts,1)
    elif tp=='matchbox':
        pygame.draw.rect(surf,(255,193,7),(cx-8,cy-5,16,10))
        pygame.draw.rect(surf,BLACK,(cx-8,cy-5,16,10),1)
        pygame.draw.line(surf,(180,130,30),(cx+6,cy-5),(cx+12,cy-12),2)
        pygame.draw.circle(surf,(255,80,0),(cx+12,cy-13),2)
    elif tp=='blood':
        pygame.draw.circle(surf,(139,0,0),(cx,cy),9)
        pygame.draw.circle(surf,(200,0,0),(cx,cy),5)
        pygame.draw.circle(surf,BLACK,(cx,cy),9,1)

def d_bsel(surf):
    surf.fill((11,11,32))
    txt(surf,"ESCOLHA O BOSS",W//2,20,GOLD,24,True,True)
    for s2,sec in enumerate(SECS):
        tx=W//2-250+s2*140; unlock=sec_ok(s2)
        c2=GOLD if s2==sec_sel and unlock else (102,68,68 if not unlock else 0)
        if s2!=sec_sel: c2=sec['c'] if unlock else (34,34,34)
        txt(surf,sec['n'],tx+55,45,c2,13,True,True)
        if s2==sec_sel:
            bc2=GOLD if unlock else (102,68,68)
            pygame.draw.line(surf,bc2,(tx+10,52),(tx+100,52),2)
    if not sec_ok(sec_sel):
        txt(surf,"Derrote todos da secao anterior!",W//2,H//2,GRAY,16,True,True)
    else:
        bosses=SECS[sec_sel]['bosses']
        cw2=min(130,(W-60)//len(bosses)-10)
        sx2=(W-(len(bosses)*(cw2+10)-10))//2
        for i,idx in enumerate(bosses):
            x=sx2+i*(cw2+10); y=70; sel=(i==bs_sel); avail=boss_ok(idx)
            bc3=b_coins[idx] if idx<len(b_coins) else 0
            bg2=(30,30,74) if sel and avail else (42,21,21) if sel else (14,14,34)
            bc4=GOLD if sel and avail else (85,51,51) if sel else (26,26,26)
            pygame.draw.rect(surf,bg2,(x,y,cw2,280))
            pygame.draw.rect(surf,bc4,(x,y,cw2,280),3 if sel else 1)
            nc=WHITE if avail else (51,51,51)
            txt(surf,BDATA[idx]['n'] if avail else "???",x+cw2//2,y+18,nc,10,True,True)
            if avail:
                ec=BDATA[idx]['s']
                bc5=[GREEN,GRAY,LTBLUE,GOLD][min(ec,3)]
                pygame.draw.ellipse(surf,bc5,(x+cw2//2-20,y+45,40,50))
                pygame.draw.circle(surf,BLACK,(x+cw2//2-6,y+65),3)
                pygame.draw.circle(surf,BLACK,(x+cw2//2+6,y+65),3)
            else:
                txt(surf,"?",x+cw2//2,y+68,(34,34,34),24,True,True)
            txt(surf,f"{BDATA[idx]['ph']} fases",x+cw2//2,y+105,(170,170,170),8,True,True)
            for j in range(3):
                mc=GOLD if (bc3&(1<<j)) else (26,26,26)
                msc=(184,134,11) if (bc3&(1<<j)) else (51,51,51)
                pygame.draw.circle(surf,mc,(x+cw2//2-15+j*15,y+125),5)
                pygame.draw.circle(surf,msc,(x+cw2//2-15+j*15,y+125),5,1)
            if not avail: txt(surf,"TRANCADO",x+cw2//2,y+252,(85,51,51),9,True,True)
            elif b_clear[idx]: txt(surf,"REPLAY",x+cw2//2,y+252,GREEN,9,True,True)
            else: txt(surf,"LUTAR!",x+cw2//2,y+252,BLUE,9,True,True)
    txt(surf,"< > S | ^ v Boss | Enter | Esc",W//2,H-12,(102,102,102),11,True,True)

def d_result(surf):
    draw_bg(surf)
    s2=pygame.Surface((W,H),pygame.SRCALPHA); s2.fill((0,0,0,166)); surf.blit(s2,(0,0))
    txt(surf,"BOSS DERROTADO!",W//2,68,GREEN,36,True,True)
    bn=boss['n'] if boss else ""
    txt(surf,bn,W//2,100,GOLD,18,True,True)
    by2=130
    txt(surf,f"Moedas: +{rN}",W//2-140,by2,WHITE,13,True)
    bc3=b_coins[bossI] if bossI<len(b_coins) else 0
    txt(surf,f"Base: {'OK' if bc3&1 else '-'}",W//2-140,by2+25,GOLD if bc3&1 else (68,68,68),13,True)
    txt(surf,f"NoHit: {'OK' if bc3&2 else '-'}",W//2-140,by2+45,GOLD if bc3&2 else (68,68,68),13,True)
    txt(surf,f"Speed: {'OK' if bc3&4 else '-'}",W//2-140,by2+65,GOLD if bc3&4 else (68,68,68),13,True)
    sec2=int(fTime//1000); mn=sec2//60
    txt(surf,f"{mn}:{sec2%60:02d} Dano:{fDmg}",W//2,by2+95,(136,136,136),12,True,True)
    txt(surf,f"{coins}",W//2,by2+125,GOLD,18,True,True)
        # Secret unlock notification
    if not secret_unlocked:
        types_in_loadout=set()
        for i in range(3):
            if loadout[i]>=0 and loadout[i]<len(WPNS):
                types_in_loadout.add(WPNS[loadout[i]]['tp'])
        if 'tomato' in types_in_loadout and 'mask' in types_in_loadout and 'mic' in types_in_loadout:
            remaining=max(0,7-secret_synergy_bosses)
            txt(surf,f"Sinergia Secreta: {secret_synergy_bosses}/7 bosses",W//2,by2+148,(180,0,180),10,True,True)
    elif secret_unlocked and has_secret():
        txt(surf,"A FORCA EQUIPADA",W//2,by2+148,(200,0,0),10,True,True)
    if (pygame.time.get_ticks()//500)%2:
        txt(surf,"ENTER:Proximo | ESC:Arsenal",W//2,by2+165,WHITE,13,True,True)

def d_over(surf):
    draw_bg(surf)
    s2=pygame.Surface((W,H),pygame.SRCALPHA); s2.fill((0,0,0,153)); surf.blit(s2,(0,0))
    txt(surf,"DERROTADO!",W//2,120,RED,46,True,True)
    txt(surf,"ENTER: Tentar | ESC: Menu",W//2,190,(136,136,136),14,True,True)

def d_victory(surf):
    surf.fill((11,11,26))
    txt(surf,"VITORIA TOTAL!",W//2,95,GOLD,48,True,True)
    txt(surf,"ENTER: Jogar novamente",W//2,290,(136,136,136),14,True,True)

def d_overlay(surf):
    s2=pygame.Surface((W,H),pygame.SRCALPHA); s2.fill((0,0,0,166)); surf.blit(s2,(0,0))
    ip=(overlay['opts'][0]=='Continuar')
    tc=GOLD if ip else RED
    txt(surf,"PAUSADO" if ip else "MENU",W//2,110,tc,36,True,True)
    for i,opt in enumerate(overlay['opts']):
        c2=GOLD if i==ov_sel else GRAY
        pre="> " if i==ov_sel else "   "
        txt(surf,pre+opt,W//2,185+i*42,c2,18,True,True)
    txt(surf,"W/S | Enter | ESC",W//2,H-20,(68,68,68),11,True,True)
def get_local_ip():
    try:
        s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);s.connect(("8.8.8.8",80))
        ip=s.getsockname()[0];s.close();return ip
    except:return "127.0.0.1"
def get_local_subnet():
    ip=get_local_ip();p=ip.split('.');return '.'.join(p[:3])+'.' if len(p)==4 else ''
def net_host():
    global net_sock,net_mode,net_status
    try:
        net_sock=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
        net_sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
        net_sock.bind(("",net_port));net_sock.listen(1);net_sock.settimeout(0.1)
        net_mode="host";net_status="Aguardando...";return True
    except Exception as e:net_status=f"Erro: {e}";return False
def net_check():
    global net_conn,net_connected,net_status,num_players,local_pid
    if net_sock and not net_conn:
        try:
            conn,addr=net_sock.accept();conn.setblocking(False)
            net_conn=conn;net_connected=True;net_status=f"Conectado: {addr[0]}"
            num_players=2;local_pid=0;return True
        except socket.timeout:return False
    return False
def net_connect(ip):
    global net_conn,net_mode,net_connected,net_status,num_players,local_pid
    try:
        net_conn=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
        net_conn.settimeout(3);net_conn.connect((ip,net_port));net_conn.setblocking(False)
        net_mode="client";net_connected=True;net_status="Conectado!"
        num_players=2;local_pid=1;return True
    except Exception as e:net_status=f"Erro: {e}";net_conn=None;return False
def net_send(data):
    if not net_conn:return
    try:net_conn.sendall(json.dumps(data).encode()+b'\n')
    except:pass
def net_recv():
    if not net_conn:return None
    try:
        data=b""
        while True:
            chunk=net_conn.recv(16384)
            if not chunk:return None
            data+=chunk
            if b'\n' in data:break
        return json.loads(data.decode().strip())
    except(BlockingIOError,socket.timeout):return None
    except:return None
def net_close():
    global net_sock,net_conn,net_mode,net_connected,remote_keys
    try:
        if net_conn:net_conn.close()
    except:pass
    try:
        if net_sock:net_sock.close()
    except:pass
    net_sock=None;net_conn=None;net_mode="local";net_connected=False;remote_keys={}
def serialize_state():
    return{'st':state,'ft':fTime,'fd':fDmg,'bi':bossI,'rN':rN,
        'pl':[{k:p[k] for k in('x','y','vx','vy','hp','mhp','face','alive','dash',
            'inv','equipped','gnd','anim','deadT','jc','id') if k in p} for p in players],
        'bo':{k:boss[k] for k in('x','y','hp','mhp','alive','phase','idx','w','h','n',
            'fl','maxPh','status','tx','ty','ms') if k in boss} if boss else None,
        'ba':b_atk,'pt':ph_tr,
        'pb':[{k:b[k] for k in('x','y','vx','vy','ext','life','pid','ang','elap','hit',
            'hitC','hitCD','gid','ret','expl','sx','radius','hit_boss_cd','owner_id','dmg',
            'landed','apply_tick') if k in b} for b in pB[-30:]],
        'eb':[{k:b[k] for k in('x','y','vx','vy','sz','c','life','grav','home') if k in b}
            for b in eB[-50:]]}
def apply_state(gs):
    global state,fTime,fDmg,bossI,rN,boss,b_atk,ph_tr,players
    ns=gs.get('st')
    if ns and ns!=state:
        state=ns
        if state=='fight':
            bossI=gs.get('bi',0)
            while len(players)<2:players.append(mk_p(len(players)))
            if boss is None:boss={}
            if not boss.get('status'):boss['status']=init_boss_status()
    fTime=gs.get('ft',fTime);fDmg=gs.get('fd',fDmg)
    bossI=gs.get('bi',bossI);rN=gs.get('rN',rN)
    for i,pd in enumerate(gs.get('pl',[])):
        while len(players)<=i:players.append(mk_p(len(players)))
        for k in('x','y','vx','vy','hp','mhp','face','alive','dash','inv','equipped',
                  'gnd','anim','deadT','jc'):
            if k in pd:players[i][k]=pd[k]
    bo=gs.get('bo')
    if bo:
        if boss is None:boss={}
        boss.update(bo)
    else:boss=None
    if gs.get('ba'):b_atk.update(gs['ba'])
    if gs.get('pt'):ph_tr.update(gs['pt'])
    pB.clear()
    for bd in gs.get('pb',[]):pB.append(bd)
    eB.clear()
    for bd in gs.get('eb',[]):
        if isinstance(bd.get('c'),list):bd['c']=tuple(bd['c'])
        eB.append(bd)
def d_sectorclear(surf):
    global _sec_t
    sec=BDATA[bossI]['s'] if bossI<len(BDATA) else 0
    bg=BG_GRAD[min(sec,3)];draw_grad(surf,(0,0,W,H),bg[0],bg[1])
    ov=pygame.Surface((W,H),pygame.SRCALPHA);ov.fill((0,0,0,140));surf.blit(ov,(0,0))
    txt(surf,"SECTOR CLEAR!",W//2,80,GOLD,42,True,True)
    sec_name=SECS[sec]['n'] if sec<len(SECS) else "???"
    txt(surf,sec_name,W//2,130,SECS[sec]['c'] if sec<len(SECS) else WHITE,24,True,True)
    txt(surf,f"Moedas: {coins}",W//2,180,YELLOW,18,True,True)
    if _sec_t>1000 and(int(_sec_t)//500)%2:
        txt(surf,"ENTER: Proximo",W//2,260,WHITE,14,True,True)

def d_lobby_host(surf):
    surf.fill((11,11,32))
    txt(surf,"HOST - MULTIPLAYER LAN",W//2,40,GOLD,24,True,True)
    txt(surf,"Seu IP:",W//2,100,WHITE,16,True,True)
    txt(surf,get_local_ip(),W//2,130,GREEN,36,True,True)
    txt(surf,f"Porta: {net_port}",W//2,175,GRAY,14,True,True)
    txt(surf,net_status,W//2,220,GOLD if net_connected else GRAY,16,True,True)
    if net_connected:txt(surf,"Conectado! Iniciando...",W//2,270,GREEN,14,True,True)
    else:txt(surf,"Aguardando jogador...",W//2,270,(100,100,100),14,True,True)
    txt(surf,"ESC: Cancelar",W//2,H-30,GRAY,12,True,True)

def d_lobby_client(surf):
    surf.fill((11,11,32))
    txt(surf,"CONECTAR - MULTIPLAYER LAN",W//2,40,GOLD,24,True,True)
    txt(surf,"IP do Host:",W//2,100,WHITE,16,True,True)
    bx=W//2-150;by=125;bw=300;bh=40
    pygame.draw.rect(surf,(30,30,60),(bx,by,bw,bh))
    pygame.draw.rect(surf,GOLD,(bx,by,bw,bh),2)
    cursor="|" if(pygame.time.get_ticks()//500)%2 else""
    txt(surf,net_ip_input+cursor,bx+10,by+10,WHITE,20)
    c2=GREEN if net_connected else(200,100,100)
    txt(surf,net_status,W//2,190,c2,14,True,True)
    txt(surf,"Digite o IP | Enter: Conectar | ESC: Cancelar",W//2,H-30,GRAY,12,True,True)

def d_netwait(surf):
    surf.fill((11,11,32))
    dots="."*int(pygame.time.get_ticks()/500)%4
    txt(surf,f"Conectado! Aguardando host{dots}",W//2,H//2-20,GOLD,18,True,True)
    txt(surf,"ESC: Desconectar",W//2,H//2+20,GRAY,12,True,True)
# ═══ MAIN LOOP ══════════════════════════════════════════
# Global CCTRLS alias for ctrl config screen
CCTRLS=CTRLS

def main():
    global coins
    global keys,just_pressed,state,sh_sel,bs_sel,sec_sel,mode_sel,save_sel
    global ctrl_p,ctrl_a,ctrl_r,bossI,cs,overlay,ov_sel,admin
    global fadeA,shake,fTime,fDmg,running,num_players,local_pid
    global net_mode,net_ip_input,net_frame,remote_keys,_sec_t,lobby_timer
    global b_atk,ph_tr,b_anim,sched,first_play,screen,fullscreen
    global loadout,loadout_active,loadout_edit_slot
    global piano_variant,piano_passive_timer,piano_passive_effect,piano_passive_dur
    global special_charge,wish_active,wish_opts,wish_sel,wish_timer,wish_thunder_pts
    global piano_laser_active,piano_laser_power
    global dt_global
    loadout_edit_slot=0
    running=True;last_t=pygame.time.get_ticks();_sec_t=0
    while running:
        t=pygame.time.get_ticks();dt=min(t-last_t,32);last_t=t
        dt_global=dt
        for ev in pygame.event.get():
            if ev.type==pygame.QUIT:running=False
            elif ev.type==pygame.KEYDOWN:
                if ev.key==pygame.K_F11:
                    fullscreen=not fullscreen
                    if fullscreen:screen=pygame.display.set_mode((0,0),pygame.FULLSCREEN)
                    else:screen=pygame.display.set_mode((W,H))
                if ev.key not in keys or not keys[ev.key]:just_pressed[ev.key]=True
                keys[ev.key]=True
                if state=='lobby_client' and not net_connected:
                    if ev.key==pygame.K_BACKSPACE:net_ip_input=net_ip_input[:-1]
                    elif ev.unicode and ev.unicode in'0123456789.' and len(net_ip_input)<15:net_ip_input+=ev.unicode
            elif ev.type==pygame.KEYUP:keys[ev.key]=False
        if fadeA>0.01:fadeA*=0.88
        else:fadeA=0
        shake*=0.88
        if shake<0.3:shake=0
        process_sched()
        # ── Rede ──
        if net_mode=='host' and net_connected:
            inp=net_recv()
            if inp and inp.get('t')=='inp':
                remote_keys={int(k):v for k,v in inp.get('k',{}).items()}
                if 'eq' in inp and len(players)>1:players[1]['equipped']=inp['eq']
            net_frame+=1
            if net_frame%3==0 and cs is None:net_send({'t':'gs','d':serialize_state()})
        elif net_mode=='client' and net_connected:
            eq_val=players[local_pid]['equipped'] if local_pid<len(players) else 0
            net_send({'t':'inp','k':{str(k):v for k,v in keys.items() if v},'eq':eq_val})
            gs=net_recv()
            if gs and gs.get('t')=='gs':apply_state(gs.get('d',{}))
                # ── Cutscene ──
        if cs:
            u_cutscene(dt)
            for k in list(just_pressed):just_pressed[k]=False
            surf=pygame.Surface((W,H));draw_bg(surf);d_cutscene(surf)
            if fadeA>0.01:fs=pygame.Surface((W,H),pygame.SRCALPHA);fs.fill((0,0,0,int(clamp(fadeA,0,1)*255)));surf.blit(fs,(0,0))
            screen.blit(surf,(0,0));pygame.display.flip();clock.tick(FPS);continue

        # ── Wish screen (sobrepõe tudo) ──
        if wish_active:
            if jp(pygame.K_w) or jp(pygame.K_UP):wish_sel=max(0,wish_sel-1)
            if jp(pygame.K_s) or jp(pygame.K_DOWN):wish_sel=min(len(wish_opts)-1,wish_sel+1)
            if jp(pygame.K_RETURN):
                apply_wish(wish_sel)
            if jp(pygame.K_ESCAPE):wish_active=False;special_charge=0

        # ── Overlay (pause) ──
        elif overlay:
            if jp(pygame.K_w) or jp(pygame.K_UP):ov_sel=max(0,ov_sel-1)
            if jp(pygame.K_s) or jp(pygame.K_DOWN):ov_sel=min(len(overlay['opts'])-1,ov_sel+1)
            if jp(pygame.K_ESCAPE):overlay=None
            if jp(pygame.K_RETURN):
                opt=overlay['opts'][ov_sel];overlay=None
                if opt=='Continuar':pass
                elif opt=='Reiniciar':fade_to('fight',start_fight)
                elif opt=='Tentar':fade_to('fight',start_fight)
                elif opt=='Boss':
                    def _bs():global sec_sel,bs_sel;sec_sel=BDATA[bossI]['s'] if bossI<len(BDATA) else 0;bs_sel=0
                    fade_to('bsel',_bs)
                elif opt=='Menu':admin=False;net_close();local_pid=0;fade_to('title');sh_sel=0

        # ── State logic (APENAS SE wish_active==False E overlay==None) ──
        elif state=='title':
            items=["JOGAR","CONTROLES"]
            if jp(pygame.K_w) or jp(pygame.K_UP):sh_sel=max(0,sh_sel-1)
            if jp(pygame.K_s) or jp(pygame.K_DOWN):sh_sel=min(len(items)-1,sh_sel+1)
            if jp(pygame.K_RETURN):
                if sh_sel==0:save_sel=cur_save if cur_save>=0 else 0;saves_data[:]=load_saves();fade_to('savesel')
                else:ctrl_p=0;ctrl_a=0;ctrl_r=False;fade_to('ctrlcfg')

        elif state=='savesel':
            if jp(pygame.K_a) or jp(pygame.K_LEFT):save_sel=max(0,save_sel-1)
            if jp(pygame.K_d) or jp(pygame.K_RIGHT):save_sel=min(2,save_sel+1)
            if jp(pygame.K_RETURN):load_save(save_sel);equipped[:]=[0,0];mode_sel=0;fade_to('modeselect')
            if jp(pygame.K_DELETE) or jp(pygame.K_BACKSPACE):
                if saves_data[save_sel]:del_sv(save_sel);saves_data[:]=load_saves()
            if jp(pygame.K_ESCAPE):fade_to('title')

        elif state=='modeselect':
            items=["1P","2P LOCAL","HOST LAN","CONECTAR LAN","VOLTAR"]
            if jp(pygame.K_w) or jp(pygame.K_UP):mode_sel=max(0,mode_sel-1)
            if jp(pygame.K_s) or jp(pygame.K_DOWN):mode_sel=min(len(items)-1,mode_sel+1)
            if jp(pygame.K_RETURN):
                if mode_sel==0:
                    num_players=1;local_pid=0;net_close()
                    if first_play:first_play=False;loadout=[0,-1,-1];loadout_active=0;start_cs('intro','shop')
                    else:fade_to('shop')
                elif mode_sel==1:
                    num_players=2;local_pid=0;net_close()
                    if first_play:first_play=False;loadout=[0,-1,-1];loadout_active=0;start_cs('intro','shop')
                    else:fade_to('shop')
                elif mode_sel==2:net_host();lobby_timer=0;fade_to('lobby_host')
                elif mode_sel==3:net_ip_input=get_local_subnet();fade_to('lobby_client')
                else:net_close();fade_to('savesel')
            if jp(pygame.K_ESCAPE):net_close();fade_to('savesel')

        elif state=='ctrlcfg':
            if not ctrl_r:
                if jp(pygame.K_w) or jp(pygame.K_UP):ctrl_a=max(0,ctrl_a-1)
                if jp(pygame.K_s) or jp(pygame.K_DOWN):ctrl_a=min(len(C_ACTS)-1,ctrl_a+1)
                if jp(pygame.K_TAB):ctrl_p=1-ctrl_p
                if jp(pygame.K_RETURN):ctrl_r=True
                if jp(pygame.K_ESCAPE):fade_to('title')
            else:
                for k in list(just_pressed):
                    if just_pressed[k]:
                        if k!=pygame.K_ESCAPE:CTRLS[ctrl_p][C_ACTS[ctrl_a]]=k
                        ctrl_r=False;just_pressed[k]=False;break

        elif state=='lobby_host':
            net_check()
            if net_connected:
                if lobby_timer==0:lobby_timer=pygame.time.get_ticks()
                if pygame.time.get_ticks()-lobby_timer>1500:
                    lobby_timer=0
                    if first_play:first_play=False;loadout=[0,-1,-1];loadout_active=0;start_cs('intro','shop')
                    else:fade_to('shop')
            if jp(pygame.K_ESCAPE):net_close();fade_to('modeselect')

        elif state=='lobby_client':
            if jp(pygame.K_RETURN) and net_ip_input and not net_connected:net_connect(net_ip_input)
            if net_connected:state='netwait'
            if jp(pygame.K_ESCAPE):net_close();fade_to('modeselect')

        elif state=='netwait':
            if jp(pygame.K_ESCAPE):net_close();fade_to('title')

        elif state=='shop':
            if net_mode=='client':
                if jp(pygame.K_d) or jp(pygame.K_RIGHT):sh_sel=min(len(WPNS)-1,sh_sel+1)
                if jp(pygame.K_a) or jp(pygame.K_LEFT):sh_sel=max(0,sh_sel-1)
                if jp(pygame.K_s) or jp(pygame.K_DOWN):sh_sel=min(len(WPNS)-1,sh_sel+5)
                if jp(pygame.K_w) or jp(pygame.K_UP):sh_sel=max(0,sh_sel-5)
                if jp(pygame.K_RETURN):
                    w=WPNS[sh_sel]
                    if w['own']:equipped[local_pid]=sh_sel
            else:
                for si in range(3):
                    k=getattr(pygame,f'K_{si+1}',None)
                    if k and jp(k):loadout_edit_slot=si
                if jp(pygame.K_d) or jp(pygame.K_RIGHT):sh_sel=min(len(WPNS)-1,sh_sel+1)
                if jp(pygame.K_a) or jp(pygame.K_LEFT):sh_sel=max(0,sh_sel-1)
                if jp(pygame.K_s) or jp(pygame.K_DOWN):sh_sel=min(len(WPNS)-1,sh_sel+5)
                if jp(pygame.K_w) or jp(pygame.K_UP):sh_sel=max(0,sh_sel-5)
                if jp(pygame.K_RETURN):
                    w=WPNS[sh_sel]
                    if not w['own'] and coins>=w['cost']:coins-=w['cost'];w['own']=1;save_game()
                    if w['own']:loadout[loadout_edit_slot]=sh_sel;equipped[local_pid]=loadout[0];loadout_active=0;save_game()
                if jp(pygame.K_SPACE):
                    sec_sel=0
                    for s2 in range(len(SECS)):
                        if sec_ok(s2):
                            ac=True
                            for j in SECS[s2]['bosses']:
                                if not b_clear[j]:ac=False;break
                            if not ac:sec_sel=s2;break
                    bs_sel=0;fade_to('bsel')
                if jp(pygame.K_ESCAPE):sh_sel=0;fade_to('modeselect')

        elif state=='bsel':
            if net_mode!='client':
                if jp(pygame.K_a) or jp(pygame.K_LEFT):
                    ns=sec_sel-1
                    if ns>=0 and sec_ok(ns):sec_sel=ns;bs_sel=0
                if jp(pygame.K_d) or jp(pygame.K_RIGHT):
                    ns=sec_sel+1
                    if ns<len(SECS) and sec_ok(ns):sec_sel=ns;bs_sel=0
                if sec_ok(sec_sel):
                    bosses=SECS[sec_sel]['bosses']
                    if jp(pygame.K_w) or jp(pygame.K_UP):bs_sel=max(0,bs_sel-1)
                    if jp(pygame.K_s) or jp(pygame.K_DOWN):bs_sel=min(len(bosses)-1,bs_sel+1)
                    if jp(pygame.K_RETURN):
                        idx=bosses[bs_sel]
                        if boss_ok(idx):bossI=idx;fade_to('fight',start_fight)
                if jp(pygame.K_ESCAPE):fade_to('shop')

        elif state=='fight':
            if net_mode!='client':
                if jp(pygame.K_ESCAPE):overlay={'opts':['Continuar','Reiniciar','Boss','Menu']};ov_sel=0
                fTime+=dt
                for p in players:u_player(p,dt)
                for p in players:shoot_p(p)
                u_boss(dt);u_bullets(dt);u_telegraphs(dt);u_pts(dt)
            else:u_pts(dt)

        elif state=='trans':
            if net_mode!='client':u_trans(dt)
            else:u_pts(dt)

        elif state=='result':
            u_pts(dt)
            if net_mode!='client':
                if jp(pygame.K_RETURN) or jp(pygame.K_SPACE):
                    s2=BDATA[bossI]['s'] if bossI<len(BDATA) else 0;sec_sel=s2
                    bl=SECS[s2]['bosses'];bs_sel=min(bl.index(bossI)+1,len(bl)-1) if bossI in bl else 0
                    fade_to('bsel')
                if jp(pygame.K_ESCAPE):fade_to('shop')

        elif state=='over':
            if net_mode!='client':
                if jp(pygame.K_RETURN) or jp(pygame.K_SPACE):fade_to('fight',start_fight)
                if jp(pygame.K_ESCAPE):overlay={'opts':['Tentar','Boss','Menu']};ov_sel=0

        elif state=='victory':
            if jp(pygame.K_RETURN) or jp(pygame.K_SPACE):reset_save();net_close();local_pid=0;save_game();fade_to('title')

        elif state=='sectorclear':
            _sec_t+=dt
            if jp(pygame.K_RETURN) or jp(pygame.K_SPACE):
                sec=BDATA[bossI]['s'] if bossI<len(BDATA) else 0;_sec_t=0;start_trans(sec)
            if jp(pygame.K_ESCAPE):_sec_t=0;fade_to('shop')
        for k in list(just_pressed):just_pressed[k]=False
        # ── Render ──
        surf=pygame.Surface((W,H));sx,sy=0,0
        if shake>1:sx,sy=int(rng(-shake,shake)),int(rng(-shake,shake))
        if state=='title':d_title(surf)
        elif state=='savesel':d_savesel(surf)
        elif state=='modeselect':d_modeselect(surf)
        elif state=='ctrlcfg':d_ctrlcfg(surf)
        elif state=='lobby_host':d_lobby_host(surf)
        elif state=='lobby_client':d_lobby_client(surf)
        elif state=='netwait':d_netwait(surf)
        elif state=='shop':d_shop(surf)
        elif state=='bsel':
            if net_mode=='client':
                surf.fill((11,11,32));txt(surf,"Aguardando host selecionar boss...",W//2,H//2,GOLD,18,True,True)
            else:d_bsel(surf)
        elif state=='fight':
            draw_bg(surf);draw_boss(surf);d_telegraphs(surf);d_bullets(surf)
            d_wish_thunder(surf)
            for p in players:
                d_player(surf,p)
                d_player_shield(surf,p)
                d_piano_laser(surf,p)
            d_pts(surf);draw_hud(surf)
        elif state=='trans':
            if net_mode=='client':
                surf.fill((11,11,32));txt(surf,"Transicao...",W//2,H//2,GOLD,18,True,True)
            else:d_trans(surf)
        elif state=='result':d_result(surf)
        elif state=='over':d_over(surf)
        elif state=='victory':d_victory(surf)
        elif state=='sectorclear':d_sectorclear(surf)

        # ── Wish screen (SEMPRE por cima de tudo) ──
        if wish_active:d_wish_screen(surf)

        if overlay:d_overlay(surf)
        if fadeA>0.01:
            fs=pygame.Surface((W,H),pygame.SRCALPHA);fs.fill((0,0,0,int(clamp(fadeA,0,1)*255)));surf.blit(fs,(0,0))
        screen.blit(surf,(sx,sy));pygame.display.flip();clock.tick(FPS)
    net_close();pygame.quit();sys.exit()

if __name__=='__main__':main()