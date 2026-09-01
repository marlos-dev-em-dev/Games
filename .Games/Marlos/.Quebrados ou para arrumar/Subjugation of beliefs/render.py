# ════════════════════════════════════════════════════════════
# render.py — Tudo visual. Recebe GameState, desenha.
# Zero logica de jogo. Componentes nomeados.
# ════════════════════════════════════════════════════════════

import pygame, math, random, struct, json, tempfile
pygame.init()

try:
    import pygame_gui
except ImportError:
    raise SystemExit("Instale: pip install pygame-gui")

# ═══════════════════════════════════════════════════════════
#  CONSTANTES
# ═══════════════════════════════════════════════════════════

W, H = 1280, 900
LN = 5
LW, LGAP = 148, 12
TW = LW * LN + LGAP * (LN - 1)
LX0 = (W - TW) // 2
LY, LH_BOARD = 218, 320
UW, UH = 118, 132
CW, CH = 104, 144
HY = H - 172
LOGX, LOGY = W - 275, 215

DB_TOP, DB_LIST_H, DB_ROW_H = 90, 520, 36
DB_LEFT_X, DB_LEFT_W = 18, 460
DB_MID_X, DB_MID_W = 495, 280
DB_RIGHT_X, DB_RIGHT_W = 795, 470
DB_BOT = 640

# Cores
BG1=(18,14,38); SURF=(38,33,62); SURF2=(52,46,82); SURF3=(68,62,100)
OL=(22,18,38); TXT=(255,250,235); TXT2=(175,170,158); TXT3=(100,95,88)
GOLD=(255,200,50); MANA_B=(70,140,255); MANA_L=(110,175,255)
HP_R=(255,65,65); HP_RL=(255,100,100); ATK_G=(65,210,75); ATK_GL=(100,235,110)
GRN=(55,200,80); RED=(200,50,50); BLU=(100,180,255); PINK=(255,140,190)
WHT=(255,255,255); LGT_S=(75,195,95); SHD_S=(175,55,215)
LN_BD=(50,45,78); BLK_F=(255,195,45); BLK_E=(48,42,30)
RC = {"common":(128,128,128),"rare":(55,135,225),
      "epic":(165,55,225),"legendary":(255,195,25)}

# Fontes
F_XS=pygame.font.SysFont("Segoe UI",11)
F_SM=pygame.font.SysFont("Segoe UI",13)
F_MD=pygame.font.SysFont("Segoe UI",16,bold=True)
F_LG=pygame.font.SysFont("Segoe UI",21,bold=True)
F_XL=pygame.font.SysFont("Segoe UI",30,bold=True)
F_TT=pygame.font.SysFont("Segoe UI",48,bold=True)
F_NUM=pygame.font.SysFont("Segoe UI",24,bold=True)

# Display
screen = pygame.display.set_mode((W, H))
pygame.display.set_caption("Card Clash v5")
clock = pygame.time.Clock()


# ═══════════════════════════════════════════════════════════
#  SOUND ENGINE (procedural, zero arquivos)
# ═══════════════════════════════════════════════════════════

class SoundEngine:
    def __init__(self):
        self.s = {}; self.on = True
        try:
            pygame.mixer.init(22050, -16, 2, 512)
            self._gen()
        except: pass

    def _buf(self, freqs, dur, vol=0.3, noise=0):
        rate=22050; n=max(1,int(rate*dur)); buf=bytearray(n*4)
        amp=max(1,sum(a for _,a in freqs)+noise)
        att=max(1,int(.005*rate)); rel=max(1,int(.05*rate)); rs=max(1,n-rel)
        for i in range(n):
            t=i/rate; v=0
            for f,a in freqs: v+=math.sin(6.2832*f*t)*a
            if noise: v+=random.uniform(-1,1)*noise
            v/=amp
            if i<att: v*=i/att
            elif i>rs: v*=max(0,(n-i)/rel)
            v=max(-1,min(1,v*vol)); s=int(v*28000)
            struct.pack_into('<hh',buf,i*4,s,s)
        return pygame.mixer.Sound(buffer=bytes(buf))

    def _t(self,f,d,v=.3): return self._buf([(f,1)],d,v)
    def _ch(self,fs,d,v=.25): return self._buf([(f,1)for f in fs],d,v)
    def _im(self,f,d,v=.35): return self._buf([(f,1)],d,v,noise=.45)

    def _gen(self):
        self.s={
            'click':self._t(900,.06,.16),'select':self._t(660,.07,.15),
            'desel':self._t(420,.05,.1),'play':self._im(340,.18,.2),
            'trick':self._ch([600,800,1000],.14,.17),'hit':self._im(110,.1,.28),
            'hit_hero':self._im(80,.16,.32),'death':self._im(70,.28,.26),
            'heal':self._ch([800,1000,1300],.16,.16),'draw':self._ch([500,700],.06,.1),
            'turn':self._ch([440,554,660],.28,.16),'block':self._ch([300,600,900],.22,.22),
            'buff':self._ch([500,700,900],.14,.16),'error':self._t(180,.14,.2),
            'victory':self._ch([523,659,784,1047],.55,.2),
            'add':self._t(880,.04,.12),'remove':self._t(440,.04,.12),
            'save':self._ch([660,880],.08,.14),
        }

    def play(self, n):
        if self.on and n in self.s:
            try: self.s[n].play()
            except: pass

    def toggle(self):
        self.on=not self.on
        if not self.on:
            try: pygame.mixer.stop()
            except: pass

snd = SoundEngine()


# ═══════════════════════════════════════════════════════════
#  PARTICLE + ANIMATION SYSTEM
# ═══════════════════════════════════════════════════════════

class Particle:
    __slots__=('x','y','vx','vy','r','g','b','life','ml','sz')
    def __init__(s,x,y,vx,vy,c,life,sz):
        s.x=x;s.y=y;s.vx=vx;s.vy=vy;s.r,s.g,s.b=c;s.life=life;s.ml=life;s.sz=sz

class ParticleSystem:
    def __init__(s): s.p=[]
    def emit(s,x,y,n,c,sp=3,life=28,sz=3):
        for _ in range(n): s.p.append(Particle(x,y,random.uniform(-sp,sp),random.uniform(-sp-.5,-.3),c,life,sz))
    def burst(s,x,y,n,cs,sp=4,life=22,sz=4):
        for _ in range(n): s.p.append(Particle(x,y,random.uniform(-sp,sp),random.uniform(-sp,sp),random.choice(cs),life,sz))
    def ring(s,x,y,n,c,radius=20,life=25,sz=3):
        for i in range(n):
            a=6.2832*i/n; s.p.append(Particle(x,y,math.cos(a)*radius*.08,math.sin(a)*radius*.08,c,life,sz))
    def confetti(s,x,y,n=50):
        cs=[(255,80,80),(80,255,80),(80,80,255),(255,255,80),(255,80,255),(80,255,255),(255,200,50)]
        for _ in range(n): s.p.append(Particle(x+random.randint(-100,100),y,random.uniform(-4,4),random.uniform(-6,-1),random.choice(cs),random.randint(40,80),random.randint(2,5)))
    def update(s):
        i=0
        while i<len(s.p):
            p=s.p[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=.06; p.vx*=.97; p.life-=1
            if p.life<=0: s.p[i]=s.p[-1]; s.p.pop()
            else: i+=1
    def draw(s,scr):
        for p in s.p:
            a=int(255*p.life/p.ml); sz=max(1,int(p.sz*p.life/p.ml))
            ss=pygame.Surface((sz*2,sz*2),pygame.SRCALPHA)
            pygame.draw.circle(ss,(p.r,p.g,p.b,a),(sz,sz),sz)
            scr.blit(ss,(int(p.x)-sz,int(p.y)-sz))

class FNum:
    def __init__(s,text,x,y,color,dur=50,dy=-1.4,font=None):
        s.text=text;s.x=x;s.y=y;s.color=color;s.timer=dur;s.mt=dur;s.dy=dy;s.font=font
    def update(s): s.y+=s.dy; s.dy*=.97; s.timer-=1
    def draw(s,scr):
        if s.timer<=0: return
        a=max(0,min(255,int(255*s.timer/(s.mt*.35))))
        f=s.font or F_NUM; t=f.render(s.text,True,s.color); t.set_alpha(a)
        scr.blit(t,(int(s.x)-t.get_width()//2,int(s.y)))
    @property
    def done(s): return s.timer<=0

class Shake:
    def __init__(s): s.pow=s.t=s.ox=s.oy=0
    def go(s,p=6,d=10): s.pow=max(s.pow,p); s.t=max(s.t,d)
    def update(s):
        if s.t>0: s.t-=1; s.ox=random.randint(-int(s.pow),int(s.pow)); s.oy=random.randint(-int(s.pow),int(s.pow)); s.pow=max(0,s.pow-.6)
        else: s.ox=s.oy=0

class Banner:
    def __init__(s,text,color,dur=65): s.text=text;s.color=color;s.timer=dur;s.mt=dur
    def update(s): s.timer-=1
    @property
    def done(s): return s.timer<=0
    def draw(s,scr):
        if s.timer<=0: return
        t=s.timer/s.mt; a=max(0,min(255,int(255*(1-abs(t*2-1)))))
        ts=F_TT.render(s.text,True,s.color); ts.set_alpha(a)
        r=ts.get_rect(center=(W//2,LY+LH_BOARD//2))
        bg=pygame.Surface((r.width+80,r.height+30),pygame.SRCALPHA); bg.fill((0,0,0,min(180,a)))
        scr.blit(bg,(r.x-40,r.y-15)); scr.blit(ts,r)

class Bounce:
    def __init__(s,pid,lane,dur=16): s.pid=pid;s.lane=lane;s.timer=dur;s.mt=dur
    def update(s): s.timer-=1
    @property
    def done(s): return s.timer<=0
    @property
    def offset_y(s):
        t=1-s.timer/s.mt
        if t<.35: return -10*(1-t/.35)
        elif t<.55: return 4*(1-(t-.35)/.2)
        return 0

class LaneFlash:
    def __init__(s,pid,lane,color=(255,50,50),dur=16):
        s.pid=pid;s.lane=lane;s.color=color;s.timer=dur;s.mt=dur
    def update(s): s.timer-=1
    @property
    def done(s): return s.timer<=0

class AnimManager:
    def __init__(s): s.fnums=[];s.shake=Shake();s.banners=[];s.bounces=[];s.flashes=[]
    def update(s):
        for f in s.fnums: f.update()
        s.fnums=[f for f in s.fnums if not f.done]
        s.shake.update()
        for b in s.banners: b.update()
        s.banners=[b for b in s.banners if not b.done]
        for b in s.bounces: b.update()
        s.bounces=[b for b in s.bounces if not b.done]
        for f in s.flashes: f.update()
        s.flashes=[f for f in s.flashes if not f.done]
    def draw(s,scr):
        for b in s.banners: b.draw(scr)
        for f in s.fnums: f.draw(scr)


# ═══════════════════════════════════════════════════════════
#  ARTE PROCEDURAL (fallback — substituir por sprites depois)
# ═══════════════════════════════════════════════════════════

def rr(s,c,r,rad=10): pygame.draw.rect(s,c,r,border_radius=rad)
def dn(c,f=.6): return tuple(max(0,int(v*f))for v in c)
def lt(c,f=1.35): return tuple(min(255,int(v*f))for v in c)
def txt_o(s,f,t,x,y,c,ol=OL,w=2):
    t1=f.render(t,True,ol)
    for dx,dy in[(-w,0),(w,0),(0,-w),(0,w)]: s.blit(t1,(x+dx,y+dy))
    s.blit(f.render(t,True,c),(x,y))
def glow(s,rect,c,rad=10,a=35):
    for i in range(rad,0,-1):
        al=int(a*(i/rad)); r=rect.inflate(i*2,i*2)
        ss=pygame.Surface((r.w,r.h),pygame.SRCALPHA)
        pygame.draw.rect(ss,(*c[:3],al),ss.get_rect(),border_radius=12)
        s.blit(ss,r.topleft)

def draw_card_art(cd, rect, big=False):
    """Arte procedural — substituir por sprite loading quando assets existirem."""
    pw, ph = rect.width, rect.height
    ov = pygame.Surface((pw, ph), pygame.SRCALPHA)
    cx, cy = pw//2, ph//2
    color = cd.get("color", (100,100,100))
    if isinstance(color, list): color = tuple(color)
    tags = set(cd.get("tags", []))
    rng = random.Random(hash(cd.get("id","")) + (1 if big else 0))
    # Gradiente
    for y in range(ph):
        t = y/max(1,ph-1)
        c = tuple(int(lt(color,1.15)[i]+(dn(color,.35)[i]-lt(color,1.15)[i])*t) for i in range(3))
        pygame.draw.line(ov, c, (0,y), (pw,y))
    # Ground
    gy = int(ph*.82)
    pygame.draw.line(ov, (*dn(color,.25),120), (0,gy), (pw,gy), 2)
    # Efeitos
    if "fogo" in tags or "relampago" in tags:
        for _ in range(6):
            pygame.draw.circle(ov,(255,180,50,35),(rng.randint(0,pw),rng.randint(gy-10,gy+5)),rng.randint(2,5))
    elif "sombra" in tags or "trevas" in tags:
        for _ in range(5):
            pygame.draw.circle(ov,(60,20,80,20),(rng.randint(0,pw),rng.randint(0,ph)),rng.randint(10,30))
    elif "sagrado" in tags or "luz" in tags:
        for i in range(12):
            ang=math.radians(i*30); ex=cx+int(math.cos(ang)*30); ey=cy-10+int(math.sin(ang)*20)
            pygame.draw.line(ov,(255,240,180,20),(cx,cy-10),(ex,ey),1)
    # Corpo generico
    s = max(.5, ph/80)
    body_c = dn(color,.7)
    # Torso
    pygame.draw.polygon(ov, body_c, [(cx-int(14*s),cy-int(8*s)),(cx+int(14*s),cy-int(8*s)),(cx+int(12*s),cy+int(12*s)),(cx-int(12*s),cy+int(12*s))])
    # Cabeca
    pygame.draw.circle(ov, lt(color,1.3), (cx, int(cy-18*s)), int(8*s))
    # Olhos
    for d in (-1,1):
        pygame.draw.circle(ov, (255,240,200), (cx+int(d*3*s), int(cy-19*s)), max(1,int(1.5*s)))
        pygame.draw.circle(ov, OL, (cx+int(d*3*s), int(cy-19*s)), max(1,int(1*s)))
    if "morto-vivo" in tags:
        for r in range(4,12,3): pygame.draw.circle(ov,(110,70,150,30),(cx,int(cy-12*s)),r,1)
    if "demnio" in tags or "demonio" in tags:
        for d in (-1,1):
            pygame.draw.polygon(ov,(210,60,50,90),[(cx+int(d*7*s),int(cy-22*s)),(cx+int(d*14*s),int(cy-34*s)),(cx+int(d*4*s),int(cy-20*s))])
    if "sagrado" in tags:
        pygame.draw.ellipse(ov,(255,220,80,90),(cx-int(10*s),int(cy-28*s),int(20*s),int(5*s)),max(1,int(2*s)))
    if "elfo" in tags:
        for d in (-1,1):
            pygame.draw.polygon(ov,(80,200,80,65),[(cx+int(d*14*s),int(cy-16*s)),(cx+int(d*20*s),int(cy-22*s)),(cx+int(d*12*s),int(cy-14*s))])
    # Noise
    for yy in range(0,ph,8):
        pygame.draw.line(ov,(255,255,255,3),(0,yy),(pw,yy-pw//3))
    screen.blit(ov, rect.topleft)


# ═══════════════════════════════════════════════════════════
#  VIEW COMPONENTS — recebem dict, desenham
# ═══════════════════════════════════════════════════════════

class CardView:
    @staticmethod
    def draw_hand(cd, x, y, sel=False, ok=True, hover=False, pulse_v=0, frame=0):
        lift = -10 if hover else 0
        r = pygame.Rect(x, y+lift, CW, CH)
        if sel: glow(screen, r.inflate(8,8), GOLD, radius=8, alpha=30)
        elif ok and pulse_v>0: glow(screen, r.inflate(4,4), GRN, radius=5, alpha=int(15*pulse_v))
        rr(screen, SURF if not hover else SURF2, r, 8)
        color = cd.get("color", (100,100,100))
        if isinstance(color, list): color = tuple(color)
        bc = GOLD if sel else RC.get(cd.get("rarity","common"), TXT3)
        pygame.draw.rect(screen, bc, r, 3 if sel else 2, border_radius=8)
        pygame.draw.rect(screen, OL, r, 2, border_radius=8)
        pygame.draw.circle(screen, MANA_B, (x+15, y+lift+15), 12)
        pygame.draw.circle(screen, OL, (x+15, y+lift+15), 12, 2)
        mt = F_SM.render(str(cd.get("mana",0)), True, WHT)
        screen.blit(mt, (x+15-mt.get_width()//2, y+lift+15-mt.get_height()//2))
        draw_card_art(cd, pygame.Rect(x+4, y+lift+30, CW-8, 32))
        txt_o(screen, F_SM, cd.get("name","?")[:13], x+6, y+lift+66, TXT, OL, 1)
        screen.blit(F_XS.render(cd.get("type",""), True, TXT3), (x+6, y+lift+82))
        desc = cd.get("desc","")
        if desc: screen.blit(F_XS.render(desc[:24], True, TXT2), (x+6, y+lift+96))
        if cd.get("type") == "unit":
            rr(screen,(25,55,25),pygame.Rect(x+4,y+lift+CH-26,30,22),4)
            at=F_MD.render(str(cd.get("atk",0)),True,ATK_G)
            screen.blit(at,(x+19-at.get_width()//2,y+lift+CH-24))
            rr(screen,(55,25,25),pygame.Rect(x+CW-34,y+lift+CH-26,30,22),4)
            ht=F_MD.render(str(cd.get("hp",0)),True,HP_R)
            screen.blit(ht,(x+CW-19-ht.get_width()//2,y+lift+CH-24))
        else:
            txt_o(screen,F_XS,"TRUQUE",x+6,y+lift+CH-18,GOLD,OL,1)
        if not ok:
            dim=pygame.Surface((CW,CH),pygame.SRCALPHA); dim.fill((0,0,0,105))
            screen.blit(dim,(x,y+lift))

    @staticmethod
    def draw_board(cd, x, y, w=UW, h=UH, bounce=0, flash=0, frame=0):
        idle = math.sin(frame*.035+cd.get("lane",0)*2.1)*2
        ry = y+int(bounce)+int(idle)
        color = cd.get("color",(100,100,100))
        if isinstance(color, list): color = tuple(color)
        rc = RC.get(cd.get("rarity","common"), TXT3)
        glow_a = 18+int(8*math.sin(frame*.04+cd.get("lane",0)))
        glow(screen, pygame.Rect(x-4,ry-4,w+8,h+8), rc, radius=6, alpha=glow_a)
        r = pygame.Rect(x, ry, w, h)
        rr(screen, SURF2, r, 10)
        pygame.draw.rect(screen, GOLD if cd.get("just_played") else rc, r, 3, border_radius=10)
        pygame.draw.rect(screen, OL, r, 2, border_radius=10)
        draw_card_art(cd, pygame.Rect(x+4, ry+4, w-8, 36))
        pygame.draw.circle(screen, MANA_B, (x+15, ry+15), 11)
        pygame.draw.circle(screen, OL, (x+15, ry+15), 11, 2)
        mt = F_SM.render(str(cd.get("mana",0)), True, WHT)
        screen.blit(mt, (x+15-mt.get_width()//2, ry+15-mt.get_height()//2))
        txt_o(screen, F_SM, cd.get("name","?")[:13], x+6, ry+44, TXT, OL, 1)
        kw = cd.get("keywords",[])
        if kw and not cd.get("silenced"):
            kwt = ",".join(k[:5] for k in kw[:2])
            screen.blit(F_XS.render(kwt, True, GOLD), (x+6, ry+59))
        elif cd.get("silenced"):
            screen.blit(F_XS.render("SILENCIADO", True, RED), (x+6, ry+59))
        sy = ry+72
        if cd.get("frozen"):
            screen.blit(F_XS.render("GELO", True, (140,200,255)), (x+6, sy))
        if cd.get("armored",0) > 0:
            screen.blit(F_XS.render(f"ARM{cd['armored']}", True, (180,165,140)), (x+52, sy))
        ar = pygame.Rect(x+4, ry+h-28, 34, 24)
        rr(screen, (25,55,25), ar, 4); pygame.draw.rect(screen, dn(ATK_G), ar, 1, border_radius=4)
        at = F_MD.render(str(cd.get("effective_atk", cd.get("atk",0))), True, ATK_GL)
        screen.blit(at, (x+21-at.get_width()//2, ry+h-26))
        hp_val = cd.get("hp",0); max_hp = cd.get("max_hp", hp_val)
        hc = HP_RL if hp_val < max_hp else TXT
        hr = pygame.Rect(x+w-38, ry+h-28, 34, 24)
        rr(screen, (55,25,25), hr, 4); pygame.draw.rect(screen, dn(HP_R), hr, 1, border_radius=4)
        ht = F_MD.render(str(hp_val), True, hc)
        screen.blit(ht, (x+w-21-ht.get_width()//2, ry+h-26))
        if flash > 0:
            fs = pygame.Surface((w,h),pygame.SRCALPHA); fs.fill((255,50,50,min(200,flash)))
            screen.blit(fs, (x, ry))


class HeroPanelView:
    @staticmethod
    def draw(pd, x, y, is_opp=False, frame=0, hp_display=None):
        side_c = LGT_S if pd.get("hero_side")=="light" else SHD_S
        txt_o(screen, F_LG, pd.get("hero_name","?"), x, y, TXT, OL, 2)
        rr(screen, side_c, pygame.Rect(x+215, y+2, 8, 22), 4)
        # HP bar
        hp = pd.get("hp",0); mhp = pd.get("max_hp",1)
        if hp_display is None: hp_display = hp
        pct = max(0, hp_display/max(1,mhp))
        rr(screen, (48,18,18), pygame.Rect(x,y+30,190,24), 5)
        if pct>0:
            c = GRN if pct>.55 else (GOLD if pct>.3 else RED)
            rr(screen, c, pygame.Rect(x,y+30,int(190*pct),24), 5)
            rr(screen, lt(c,1.5), pygame.Rect(x,y+30,int(190*pct),8), 5)
        if 0<pct<.3:
            ox=int(2*math.sin(frame/4))
            pygame.draw.rect(screen, RED, pygame.Rect(x+ox,y+30,190,24),2,border_radius=5)
        else:
            pygame.draw.rect(screen,(65,65,65),pygame.Rect(x,y+30,190,24),1,border_radius=5)
        txt_o(screen, F_MD, f"{max(0,hp)}/{mhp}", x+76, y+32, WHT, OL, 1)
        # Mana
        mana = pd.get("mana",0); max_mana = pd.get("max_mana",0)
        for i in range(max_mana):
            cx = x+i*18
            if i<mana:
                pygame.draw.circle(screen,MANA_L,(cx+8,y+68),8)
                pygame.draw.circle(screen,MANA_B,(cx+8,y+68),8,2)
                pygame.draw.circle(screen,(160,200,255),(cx+6,y+66),max(1,2+int(math.sin(frame/20+i))))
            else:
                pygame.draw.circle(screen,BLK_E,(cx+8,y+68),8)
                pygame.draw.circle(screen,(55,50,72),(cx+8,y+68),8,1)
        txt_o(screen, F_MD, f"{mana}/{max_mana}", x+max_mana*18+10, y+66, MANA_L, OL, 1)
        # Block
        screen.blit(F_XS.render("BLOCK",True,TXT3),(x,y+90))
        bm = pd.get("block_meter",0); bmx = pd.get("block_max",4)
        for i in range(bmx):
            bx=x+42+i*26; r=pygame.Rect(bx,y+88,22,20)
            if i<bm: rr(screen,BLK_F,r,4); pygame.draw.circle(screen,WHT,(bx+11,y+95),3)
            else: rr(screen,BLK_E,r,4)
            pygame.draw.rect(screen,(65,58,40),r,1,border_radius=4)
        # Deck
        dc = pd.get("deck_count",0)
        dct = HP_R if dc==0 else TXT2
        dtt = "VAZIO!" if dc==0 else f"Deck:{dc}"
        screen.blit(F_SM.render(dtt,True,dct),(x+155,y+67))
        screen.blit(F_SM.render(f"Mao:{pd.get('hand_count',0)}",True,TXT2),(x+155,y+84))
        # Mao oponente (verso)
        if is_opp:
            for i in range(min(pd.get("hand_count",0),7)):
                r=pygame.Rect(x+i*20,y+112,42,56)
                rr(screen,(32,24,48),r,5); pygame.draw.rect(screen,SHD_S,r,1,border_radius=5)
                qt=F_MD.render("?",True,(65,55,80))
                screen.blit(qt,(r.centerx-qt.get_width()//2,r.centery-qt.get_height()//2))


class BoardView:
    @staticmethod
    def draw(state, anim, frame, psys, selected=-1, valid_lanes=None):
        if valid_lanes is None: valid_lanes = []
        p1 = state["players"][0]
        p2 = state["players"][1]
        sx, sy = anim.shake.ox, anim.shake.oy
        mx, my = pygame.mouse.get_pos()
        hover_unit = None

        # Board panel
        bp = pygame.Rect(LX0-16+sx, LY-36+sy, TW+32, LH_BOARD+78)
        rr(screen,(22,18,40),bp,14)
        pygame.draw.rect(screen,LN_BD,bp,3,border_radius=14)
        pygame.draw.rect(screen,OL,bp,2,border_radius=14)
        txt_o(screen,F_XS,"OPONENTE",LX0-6+sx,LY-30+sy,TXT3,OL,1)
        txt_o(screen,F_XS,"VOCE",LX0-6+sx,LY+LH_BOARD+6+sy,TXT3,OL,1)

        # Heroes
        HeroPanelView.draw(p2, 20, 15, True, frame)
        HeroPanelView.draw(p1, 20, H-200, False, frame)

        # Divider
        mid=LY+LH_BOARD//2+sy
        pygame.draw.line(screen,(60,55,90),(LX0-8+sx,mid),(LX0+TW+8+sx,mid),3)

        # Lanes
        for li in range(LN):
            lx=LX0+li*(LW+LGAP)+sx
            lc=(30,26,50) if li%2==0 else (34,28,54)
            lr=pygame.Rect(lx-2,LY-2+sy,LW+4,LH_BOARD+4)
            rr(screen,lc,lr,10); pygame.draw.rect(screen,LN_BD,lr,2,border_radius=10)
            txt_o(screen,F_XS,f"Lane {li+1}",lx+4,LY-18+sy,TXT3,OL,1)

            # Oponente
            p2u=p2["lanes"][li] if li<len(p2["lanes"]) else None
            if p2u:
                ux=lx+(LW-UW)//2
                bounce=sum(b.offset_y for b in anim.bounces if b.pid==1 and b.lane==li and not b.done)
                flash=sum(int(180*f.timer/f.mt) for f in anim.flashes if f.pid==1 and f.lane==li and not f.done)
                CardView.draw_board(p2u, ux, LY+5+sy, bounce=bounce, flash=flash, frame=frame)
                if pygame.Rect(ux,LY+5+sy,UW,UH).collidepoint(mx,my): hover_unit=(1,li)

            # Jogador
            p1u=p1["lanes"][li] if li<len(p1["lanes"]) else None
            slot_y=LY+LH_BOARD//2+5+sy
            if p1u:
                ux=lx+(LW-UW)//2
                bounce=sum(b.offset_y for b in anim.bounces if b.pid==0 and b.lane==li and not b.done)
                flash=sum(int(180*f.timer/f.mt) for f in anim.flashes if f.pid==0 and f.lane==li and not f.done)
                CardView.draw_board(p1u, ux, slot_y, bounce=bounce, flash=flash, frame=frame)
                if pygame.Rect(ux,slot_y,UW,UH).collidepoint(mx,my): hover_unit=(0,li)
            else:
                slot=pygame.Rect(lx+5,slot_y,LW-10,UH)
                if li in valid_lanes and state["current_player"]==0:
                    ss=pygame.Surface((LW-10,UH),pygame.SRCALPHA)
                    ss.fill((55,200,80,int(22+16*math.sin(frame/18))))
                    screen.blit(ss,slot.topleft)
                    pygame.draw.rect(screen,GRN,slot,3,border_radius=8)
                    txt_o(screen,F_MD,f"[{li+1}]",slot.centerx-8,slot.centery-10,GRN,OL,1)

        # Hand
        hand = p1.get("hand", [])
        if state["current_player"] == 0 and hand:
            hx0=(W-len(hand)*(CW+8))//2; hover_idx=-1
            pv=.5+.5*math.sin(frame/14)
            for i,cd in enumerate(hand):
                cx=hx0+i*(CW+8); hover=cx<=mx<=cx+CW and HY<=my<=HY+CH
                if hover: hover_idx=i
                ok=state["players"][0]["mana"]>=cd.get("mana",0)
                CardView.draw_hand(cd, cx, HY, i==selected, ok, hover,
                                   pulse_v=pv if(ok and i!=selected)else 0, frame=frame)
            # Preview
            preview_cd = None
            if 0<=hover_idx<len(hand): preview_cd=hand[hover_idx]
            elif 0<=selected<len(hand): preview_cd=hand[selected]
            if preview_cd: Render.draw_preview(preview_cd, mx, my)

        return hover_unit


class LogView:
    @staticmethod
    def draw(log_list):
        for i, line in enumerate(log_list[-15:]):
            c=TXT3
            if "VENCEU" in line or "BLOQUEIO" in line: c=GOLD
            elif "dano" in line.lower() or "morreu" in line.lower() or "vs" in line: c=RED
            elif "curou" in line.lower() or "comprou" in line.lower(): c=GRN
            elif "Turno" in line: c=GOLD
            elif "+" in line and "/" in line: c=BLU
            screen.blit(F_XS.render(line[:56],True,c),(LOGX,LOGY+i*16))


class PreviewView:
    @staticmethod
    def draw(cd, mx, my):
        pw,ph=280,380
        px=min(mx+18,W-pw-18); py=max(12,my-ph//2); py=min(py,H-ph-12)
        r=pygame.Rect(px,py,pw,ph)
        color=cd.get("color",(100,100,100))
        if isinstance(color,list): color=tuple(color)
        rc=RC.get(cd.get("rarity","common"),TXT3)
        glow(screen,r.inflate(10,10),rc,radius=12,alpha=25)
        rr(screen,(15,12,25),r,12)
        pygame.draw.rect(screen,rc,r,3,border_radius=12)
        pygame.draw.rect(screen,OL,r,2,border_radius=12)
        draw_card_art(cd,pygame.Rect(px+10,py+10,pw-20,110),big=True)
        pygame.draw.circle(screen,MANA_B,(px+30,py+30),20)
        pygame.draw.circle(screen,OL,(px+30,py+30),20,3)
        mt=F_LG.render(str(cd.get("mana",0)),True,WHT)
        screen.blit(mt,(px+30-mt.get_width()//2,py+30-mt.get_height()//2))
        rn=cd.get("rarity","common").upper()
        screen.blit(F_XS.render(rn,True,rc),(px+pw-F_XS.size(rn)[0]-14,py+14))
        txt_o(screen,F_LG,cd.get("name","?"),px+16,py+126,TXT,OL,2)
        screen.blit(F_SM.render(cd.get("type","").upper(),True,TXT2),(px+16,py+152))
        pygame.draw.line(screen,SURF3,(px+16,py+172),(px+pw-16,py+172))
        desc=cd.get("desc","")
        if desc:
            words=desc.split();lines,line=[],""
            for w_ in words:
                test=f"{line} {w_}" if line else w_
                if F_SM.size(test)[0]<pw-32: line=test
                else: lines.append(line);line=w_
            if line: lines.append(line)
            for i,ln in enumerate(lines[:6]):
                screen.blit(F_SM.render(ln,True,TXT2),(px+16,py+178+i*18))
        if cd.get("type")=="unit":
            txt_o(screen,F_XL,str(cd.get("atk",0)),px+20,py+ph-75,ATK_GL,OL,2)
            screen.blit(F_SM.render("ATK",True,ATK_G),(px+22,py+ph-36))
            txt_o(screen,F_XL,str(cd.get("hp",0)),px+pw-58,py+ph-75,HP_RL,OL,2)
            screen.blit(F_SM.render("HP",True,HP_R),(px+pw-48,py+ph-36))
        kw=cd.get("keywords",[])
        if kw:
            screen.blit(F_SM.render(" | ".join(kw),True,GOLD),(px+16,py+ph-24))
        tags=cd.get("tags",[])
        if tags:
            screen.blit(F_XS.render(", ".join(tags[:5]),True,TXT3),(px+16,py+ph-8))


# ═══════════════════════════════════════════════════════════
#  MAIN RENDER CLASS — recebe GameState, desenha tudo
# ═══════════════════════════════════════════════════════════

class Render:
    def __init__(self, data):
        self.data = data
        self.cards_db = data["cards"]
        self.mgr = pygame_gui.UIManager((W, H), self._theme())
        self.psys = ParticleSystem()
        self.anim = AnimManager()
        self.frame = 0
        self.hp_display = [float(data["heroes"][h]["hp"]) for h in list(data["heroes"].keys())[:2]]
        self._bg = self._make_bg()
        self._stars = [(random.randint(0,W),random.randint(0,H),random.choice([1,1,2]),random.uniform(0,6.28)) for _ in range(40)]
        # UI elements
        self.els = []
        self.state = None
        # Deck builder
        self.db_deck = []
        self.db_avail_ids = []
        self.db_avail_names = []
        self.db_deck_names = []
        self.db_preview = None
        self.db_presets = []
        self.db_active = 0
        self.db_hero_id = ""

    def _theme(self):
        T={"button":{"font":{"name":"Segoe UI","size":"16","bold":"1"},
            "colours":{"normal_bg":"#342e52","hovered_bg":"#d4af37","disabled_bg":"#2a2520",
                       "active_bg":"#fffae8","normal_text":"#fffae8","hovered_text":"#161220",
                       "disabled_text":"#645e58","active_text":"#161220"},
            "misc":{"shape":"rounded_rectangle","shape_corner_radius":"8","border_width":"2","shadow_width":"0"}},
           "selection_list":{"font":{"name":"Segoe UI","size":"13"},
            "colours":{"normal_bg":"#262142","dark_bg":"#161220","normal_text":"#fffae8",
                       "hovered_text":"#d4af37","selected_text":"#161220","selected_bg":"#d4af37"},
            "misc":{"border_width":"2","border_colour":"#322e5e","shadow_width":"0"}},
           "text_entry_line":{"font":{"name":"Segoe UI","size":"14"},
            "colours":{"normal_bg":"#262142","hovered_bg":"#342e52","normal_text":"#fffae8",
                       "selected_text":"#ffffff","normal_text_cursor":"#d4af37"},
            "misc":{"border_width":"2","border_colour":"#322e5e","shadow_width":"0"}}}
        f=tempfile.NamedTemporaryFile(mode='w',suffix='.json',delete=False)
        json.dump(T,f); f.close(); return f.name

    def _make_bg(self):
        s=pygame.Surface((W,H))
        for y in range(H): t=y/H; pygame.draw.line(s,(int(18+14*t),int(14+10*t),int(38+18*t)),(0,y),(W,y))
        rng=random.Random(42)
        for _ in range(90):
            x,y=rng.randint(0,W),rng.randint(0,H); c=rng.randint(35,80)
            pygame.draw.circle(s,(c,c,int(c*.85)),(x,y),rng.choice([1,1,2,2,3]))
        return s

    def _kill(self):
        for e in self.els:
            try: e.kill()
            except: pass
        self.els.clear()

    def _find_idx(self, name, names):
        try: return names.index(name)
        except: return -1

    def _rebuild_db_names(self):
        counts = {}
        for c in self.db_deck: counts[c] = counts.get(c, 0) + 1
        self.db_avail_names = []
        self.db_avail_ids = []
        for cid in self.db_avail_ids_orig if hasattr(self, 'db_avail_ids_orig') else []:
            cd = self.cards_db.get(cid, {})
            cnt = counts.get(cid, 0)
            self.db_avail_names.append(f"[{cd.get('mana',0)}] {cd.get('name','?')} ({cnt}/4)")
            self.db_avail_ids.append(cid)
        sorted_d = sorted(counts.items(), key=lambda x: (self.cards_db.get(x[0],{}).get("mana",0), self.cards_db.get(x[0],{}).get("name","")))
        self.db_deck_names = []
        self.db_deck_sorted_ids = []
        for cid, cnt in sorted_d:
            cd = self.cards_db.get(cid, {})
            self.db_deck_names.append(f"{cnt}x [{cd.get('mana',0)}] {cd.get('name','?')}")
            self.db_deck_sorted_ids.append(cid)

    # ── Process events (UI) and return game actions ──────

    def process_events(self, events, state=None):
        """Returns list of game actions from UI interaction."""
        actions = []
        for ev in events:
            self.mgr.process_events(ev)
            if ev.type == pygame_gui.UI_BUTTON_PRESSED:
                el = ev.ui_element
                if hasattr(self, 'play_btn') and el == self.play_btn:
                    actions.append({"type": "go_select"})
                elif hasattr(self, 'quit_btn') and el == self.quit_btn:
                    actions.append({"type": "quit"})
                elif hasattr(self, 'back_btn') and el == self.back_btn:
                    actions.append({"type": "go_menu"})
                elif hasattr(self, 'db_back') and el == self.db_back:
                    actions.append({"type": "go_select"})
                elif hasattr(self, 'db_clear') and el == self.db_clear:
                    actions.append({"type": "db_clear"})
                elif hasattr(self, 'db_start') and el == self.db_start:
                    actions.append({"type": "db_start"})
                elif hasattr(self, 'end_btn') and el == self.end_btn:
                    actions.append({"type": "end_turn"})
                elif hasattr(self, 'menu_btn') and el == self.menu_btn:
                    actions.append({"type": "go_menu"})
                elif hasattr(self, 'hero_btns'):
                    for btn, hid in self.hero_btns:
                        if el == btn: actions.append({"type": "select_hero", "hero": hid})
                elif hasattr(self, 'add_btn') and el == self.add_btn:
                    sel = self.avail_list.get_single_selection()
                    if sel:
                        idx = self._find_idx(sel, self.db_avail_names)
                        if idx >= 0: actions.append({"type": "db_add", "card": self.db_avail_ids[idx]})
                elif hasattr(self, 'rem_btn') and el == self.rem_btn:
                    sel = self.deck_list.get_single_selection()
                    if sel:
                        idx = self._find_idx(sel, self.db_deck_names)
                        if idx >= 0: actions.append({"type": "db_rem", "card": self.db_deck_sorted_ids[idx]})
                elif hasattr(self, 'preset_btns'):
                    for i, pb in enumerate(self.preset_btns):
                        if el == pb: actions.append({"type": "preset_switch", "index": i})
            elif ev.type == pygame_gui.UI_SELECTION_LIST_DOUBLE_CLICKED_SELECTION:
                if hasattr(self, 'avail_list') and ev.ui_element == self.avail_list:
                    sel = self.avail_list.get_single_selection()
                    if sel:
                        idx = self._find_idx(sel, self.db_avail_names)
                        if idx >= 0: actions.append({"type": "db_add", "card": self.db_avail_ids[idx]})
                elif hasattr(self, 'deck_list') and ev.ui_element == self.deck_list:
                    sel = self.deck_list.get_single_selection()
                    if sel:
                        idx = self._find_idx(sel, self.db_deck_names)
                        if idx >= 0: actions.append({"type": "db_rem", "card": self.db_deck_sorted_ids[idx]})
            elif ev.type == pygame_gui.UI_TEXT_ENTRY_FINISHED:
                if hasattr(self, 'preset_entry') and ev.ui_element == self.preset_entry:
                    actions.append({"type": "preset_rename", "name": ev.text})
        return actions

    # ── Setup screens ────────────────────────────────────

    def enter_menu(self):
        self._kill(); self.state = "menu"
        cx = W//2-115
        self.play_btn = pygame_gui.elements.UIButton(pygame.Rect(cx,340,230,48),"Iniciar Jogo",self.mgr)
        self.quit_btn = pygame_gui.elements.UIButton(pygame.Rect(cx,405,230,48),"Sair",self.mgr)
        self.els = [self.play_btn, self.quit_btn]

    def enter_select(self, heroes_db):
        self._kill(); self.state = "select"
        self.hero_btns = []
        for i, (hid, h) in enumerate(heroes_db.items()):
            b = pygame_gui.elements.UIButton(pygame.Rect(W//2-200,155+i*82,400,68), h["name"], self.mgr)
            self.hero_btns.append((b, hid))
        self.back_btn = pygame_gui.elements.UIButton(pygame.Rect(20,20,105,38),"Voltar",self.mgr)
        self.els = [b for b,_ in self.hero_btns]+[self.back_btn]

    def enter_deck_builder(self, hero_id, hero_data, all_cards, decks_db, presets):
        self._kill(); self.state = "deck"
        self.db_hero_id = hero_id
        self.db_presets = presets; self.db_active = 0
        self.db_deck = list(presets[0]["cards"])
        side = hero_data["side"]
        self.db_avail_ids_orig = sorted(
            [cid for cid, cd in all_cards.items() if cd["side"]==side and "superpoder" not in cd.get("tags",[])],
            key=lambda c: (all_cards[c].get("mana",0), all_cards[c].get("name","")))
        self._rebuild_db_names()
        list_h = DB_LIST_H-55
        self.avail_list = pygame_gui.elements.UISelectionList(
            pygame.Rect(DB_LEFT_X,DB_TOP,DB_LEFT_W,list_h), self.db_avail_names, self.mgr, allow_double_clicks=True)
        self.deck_list = pygame_gui.elements.UISelectionList(
            pygame.Rect(DB_MID_X,DB_TOP,DB_MID_W,list_h), self.db_deck_names, self.mgr, allow_double_clicks=True)
        btn_y = DB_TOP+list_h+5
        self.add_btn = pygame_gui.elements.UIButton(pygame.Rect(DB_LEFT_X,btn_y,DB_LEFT_W,32),"+ Adicionar",self.mgr)
        self.rem_btn = pygame_gui.elements.UIButton(pygame.Rect(DB_MID_X,btn_y,DB_MID_W,32),"- Remover",self.mgr)
        self.preset_entry = pygame_gui.elements.UITextEntryLine(
            pygame.Rect(DB_MID_X,DB_BOT-40,200,30),self.mgr,initial_text=presets[0]["name"])
        self.preset_btns = []
        for i in range(3):
            self.preset_btns.append(pygame_gui.elements.UIButton(
                pygame.Rect(DB_MID_X+i*98,DB_BOT,92,34),f"P{i+1}",self.mgr))
        self.db_back = pygame_gui.elements.UIButton(pygame.Rect(DB_LEFT_X,H-58,110,38),"Voltar",self.mgr)
        self.db_clear = pygame_gui.elements.UIButton(pygame.Rect(DB_LEFT_X+125,H-58,110,38),"Limpar",self.mgr)
        self.db_start = pygame_gui.elements.UIButton(pygame.Rect(W-220,H-58,200,38),"Jogar",self.mgr)
        self.els = [self.avail_list,self.deck_list,self.add_btn,self.rem_btn,
                    self.preset_entry,self.db_back,self.db_clear,self.db_start]+self.preset_btns

    def enter_play(self):
        self._kill(); self.state = "play"
        self.end_btn = pygame_gui.elements.UIButton(pygame.Rect(W-200,HY-42,180,40),"Fim do Turno [Space]",self.mgr)
        self.els = [self.end_btn]
        self.anim.banners.append(Banner("ROUND 1!",GOLD,60))
        snd.play('turn')

    def enter_over(self):
        self._kill(); self.state = "over"
        self.menu_btn = pygame_gui.elements.UIButton(pygame.Rect(W//2-115,460,230,48),"Menu Principal",self.mgr)
        self.els = [self.menu_btn]

    # ── Process visual events from game ──────────────────

    def process_game_events(self, game_events):
        for ev in game_events:
            t = ev.get("type")
            if t == "UNIT_HIT":
                pid,lane,val = ev.get("player",0),ev.get("lane",0),ev.get("value",0)
                if val>0 and 0<=lane<LN:
                    lx=LX0+lane*(LW+LGAP)+LW//2; ly=LY+30 if pid==1 else LY+LH_BOARD//2+35
                    self.anim.fnums.append(FNum(f"-{val}",lx,ly,HP_RL))
                    self.psys.emit(lx,ly,8,(255,80,80),sp=3,life=20)
                    self.anim.flashes.append(LaneFlash(pid,lane)); snd.play('hit')
            elif t == "HERO_HIT":
                pid,val = ev.get("player",0),ev.get("value",0)
                if val>0:
                    ly=155 if pid==1 else H-215
                    self.anim.fnums.append(FNum(f"-{val}",140,ly,HP_RL))
                    self.psys.emit(140,ly,12,(255,60,60),sp=4,life=25)
                    self.anim.shake.go(min(10,val+3),14); snd.play('hit_hero')
            elif t == "HERO_HEAL":
                pid,val = ev.get("player",0),ev.get("value",0)
                if val>0:
                    ly=155 if pid==1 else H-215
                    self.anim.fnums.append(FNum(f"+{val}",180,ly,PINK))
                    self.psys.emit(180,ly,8,(255,140,200),sp=2,life=25); snd.play('heal')
            elif t == "UNIT_HEAL":
                pid,lane,val = ev.get("player",0),ev.get("lane",0),ev.get("value",0)
                if val>0 and 0<=lane<LN:
                    lx=LX0+lane*(LW+LGAP)+LW//2; ly=LY+30 if pid==1 else LY+LH_BOARD//2+35
                    self.anim.fnums.append(FNum(f"+{val}",lx,ly,PINK))
                    self.psys.emit(lx,ly,5,(255,150,200),sp=2,life=20); snd.play('heal')
            elif t == "UNIT_BUFF":
                pid,lane,val = ev.get("player",0),ev.get("lane",0),ev.get("value",0)
                if 0<=lane<LN:
                    lx=LX0+lane*(LW+LGAP)+LW//2; ly=LY+50 if pid==1 else LY+LH_BOARD//2+55
                    self.anim.fnums.append(FNum(f"+{val}/+{val}",lx,ly,BLU,dur=42))
                    self.psys.burst(lx,ly,10,[(100,180,255),(150,210,255),(200,230,255)],sp=3,life=25)
                    snd.play('buff')
            elif t == "BLOCK":
                pid=ev.get("player",0); ly=130 if pid==1 else H-245
                self.anim.fnums.append(FNum("BLOQUEIO!",160,ly,GOLD,dur=48,font=F_LG))
                self.psys.ring(160,ly,14,GOLD,radius=35,life=30); snd.play('block')
            elif t == "UNIT_DIED":
                lane,pid = ev.get("lane",0),ev.get("player",0)
                if 0<=lane<LN:
                    lx=LX0+lane*(LW+LGAP)+LW//2; ly=LY+25 if pid==1 else LY+LH_BOARD//2+30
                    self.psys.burst(lx,ly,18,[(120,120,130),(80,80,90),(160,160,170)],sp=5,life=35,sz=5)
                    self.anim.flashes.append(LaneFlash(pid,lane,(255,100,100),20)); snd.play('death')
            elif t == "DRAW_CARD": snd.play('draw')
            elif t == "CARD_PLAYED":
                pid,ctype,lane = ev.get("player",0),ev.get("ctype","unit"),ev.get("lane",-1)
                if ctype=="unit" and 0<=lane<LN:
                    self.anim.bounces.append(Bounce(pid,lane))
                    lx=LX0+lane*(LW+LGAP)+LW//2; ly=LY+LH_BOARD//2+30 if pid==0 else LY+30
                    self.psys.burst(lx,ly,12,[(255,255,255),(200,200,255)],sp=3,life=18); snd.play('play')
                elif ctype=="trick":
                    self.psys.burst(W//2,LY+LH_BOARD//2,18,[(255,200,50),(255,255,200)],sp=5,life=25); snd.play('trick')
            elif t == "GAME_OVER":
                self.psys.confetti(W//2,200,50); snd.play('victory')

    # ── Draw ─────────────────────────────────────────────

    def draw(self, state, game_events):
        self.frame += 1
        self.psys.update(); self.anim.update()
        self.process_game_events(game_events)

        screen.blit(self._bg,(0,0))
        for x,y,sz,ph in self._stars:
            v=int(45+35*math.sin(self.frame/40+ph))
            pygame.draw.circle(screen,(v,v,int(v*.85)),(x,y),sz)

        if self.state == "menu": self._draw_menu()
        elif self.state == "select": self._draw_select()
        elif self.state == "deck": self._draw_deck()
        elif self.state == "play" and state: self._draw_play(state)
        elif self.state == "over" and state: self._draw_play(state); self._draw_over(state)

        self.psys.draw(screen); self.anim.draw(screen)
        pygame.display.flip()

    def _draw_menu(self):
        t=self.frame/55; g=int(210+45*math.sin(t*2)); tc=(g,int(g*.82),int(g*.22))
        txt_o(screen,F_TT,"CARD CLASH",W//2-140,138,tc,OL,3)
        txt_o(screen,F_LG,"Arquitetura Engine v5",W//2-105,198,TXT2,OL,1)
        pygame.draw.line(screen,SURF3,(W//2-130,232),(W//2+130,232),2)
        self.mgr.draw_ui(screen)

    def _draw_select(self):
        txt_o(screen,F_XL,"Escolha seu Heroi",W//2-120,78,TXT,OL,2)
        pygame.draw.line(screen,SURF3,(W//2-155,116),(W//2+155,116),2)
        self.mgr.draw_ui(screen)

    def _draw_deck(self):
        hero_name = self.cards_db.get("guardiao",{}).get("name","")  # placeholder
        n = len(self.db_deck)
        txt_o(screen,F_XL,f"DECK BUILDER",DB_LEFT_X,8,TXT,OL,2)
        cnt_c = GRN if 20<=n<=30 else RED
        txt_o(screen,F_LG,f"{n}/30",DB_LEFT_X,44,cnt_c,OL,1)
        if n<20: screen.blit(F_MD.render(f"(min:20)",True,RED),(DB_LEFT_X+80,46))
        self.mgr.draw_ui(screen)
        if self.db_preview:
            cd = self.cards_db.get(self.db_preview,{})
            if cd: PreviewView.draw({"id":self.db_preview,**cd}, DB_RIGHT_X, DB_TOP)
        else:
            screen.blit(F_SM.render("Selecione uma carta",True,TXT3),(DB_RIGHT_X+20,DB_TOP+40))
            screen.blit(F_SM.render("para ver detalhes.",True,TXT3),(DB_RIGHT_X+20,DB_TOP+58))

    def _draw_play(self, state):
        p1=state["players"][0]; p2=state["players"][1]
        selected=state.get("selected_hand",-1)
        valid=state.get("valid_lanes",[])
        mx,my=pygame.mouse.get_pos()

        hover_unit = BoardView.draw(state, self.anim, self.frame, self.psys, selected, valid)

        if state["current_player"]==0:
            if len(p1.get("hand",[]))>=7:
                txt_o(screen,F_SM,"MAO CHEIA!",W-200,HY-60,RED,OL,1)
        else:
            dots="."*(3-(self.frame//8)%4)
            cv=int(190+65*math.sin(self.frame/28))
            txt_o(screen,F_LG,f"IA pensando{dots}",LX0,LY+LH_BOARD+10,(cv,cv,65),OL,1)

        if hover_unit:
            pid,lane=hover_unit; u=state["players"][pid]["lanes"][lane]
            if u: self._draw_tooltip(u,mx,my)

        txt_o(screen,F_MD,f"Round {state['turn']}",LX0+TW//2-30,LY-36,TXT2,OL,1)
        if state["current_player"]==0 and state["phase"]=="play":
            txt_o(screen,F_LG,"SEU TURNO",LX0,LY+LH_BOARD+10,GRN,OL,1)
        LogView.draw(state.get("log",[]))
        screen.blit(F_XS.render("[1-5]Lane [Q-U]Mao [RMB]Soltar [M]Mudo",True,TXT3),(20,H-12))
        self.mgr.draw_ui(screen)

    def _draw_tooltip(self, cd, mx, my):
        lines=[cd.get("name","?"),f"ATK:{cd.get('effective_atk',cd.get('atk',0))} HP:{cd.get('hp',0)}/{cd.get('max_hp',0)}",
               f"Mana:{cd.get('mana',0)} Raridade:{cd.get('rarity','common')}"]
        kw=cd.get("keywords",[])
        if kw: lines.append(f"KW: {', '.join(kw)}")
        desc=cd.get("desc","")
        if desc: lines.append(desc)
        tw=max(F_SM.size(l)[0] for l in lines)+24; th=len(lines)*18+12
        tx=min(mx+12,W-tw-12); ty=max(12,my-th-12)
        rr(screen,(12,10,20),pygame.Rect(tx,ty,tw,th),8)
        pygame.draw.rect(screen,RC.get(cd.get("rarity","common"),TXT3),pygame.Rect(tx,ty,tw,th),2,border_radius=8)
        pygame.draw.rect(screen,OL,pygame.Rect(tx,ty,tw,th),1,border_radius=8)
        for i,l in enumerate(lines):
            screen.blit(F_SM.render(l,True,TXT if i==0 else TXT2),(tx+12,ty+6+i*18))

    def _draw_over(self, state):
        ov=pygame.Surface((W,H),pygame.SRCALPHA); ov.fill((0,0,0,175)); screen.blit(ov,(0,0))
        w=state["winner"]
        if w is not None:
            wp=state["players"][w]; t=self.frame/38; g=int(210+45*math.sin(t*2)); tc=(g,int(g*.82),int(g*.22))
            for i in range(8):
                a=6.2832*i/8+self.frame/80
                pygame.draw.circle(screen,GOLD,(W//2+int(200*math.cos(a)),240+int(80*math.sin(a))),int(3+2*math.sin(self.frame/20+i)))
            txt_o(screen,F_TT,f"{wp['hero_name']} VENCEU!",W//2-220,230,tc,OL,3)
            txt_o(screen,F_LG,f"Round {state['turn']} | HP:{max(0,wp['hp'])}",W//2-90,305,TXT2,OL,1)
        self.mgr.draw_ui(screen)

    @staticmethod
    def draw_preview(cd, mx, my):
        PreviewView.draw(cd, mx, my)