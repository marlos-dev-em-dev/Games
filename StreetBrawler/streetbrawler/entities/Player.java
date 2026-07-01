package streetbrawler.entities;
import java.awt.*;
import java.awt.geom.AffineTransform;
import streetbrawler.Game;
import static streetbrawler.utils.MathUtils.*;
import static streetbrawler.world.Collision.*;

public class Player {
    public double x, y, vx, vy;
    public int face = 1, ctype, hp, maxHp;
    public double sp = 0;
    public boolean rage = false, dashing = false;
    public Move curMove = null;
    public double moveTimer = 0, comboWin = 0;
    public int comboIdx = 0;
    public boolean moveHit = false, atkBuf = false;
    public double dashCD = 0, dashT = 0, invT = 0, wf = 0;
    public int jumpsMax = 1, jumpsLeft = 1;
    public boolean[] abilities = new boolean[5];

    public static class Move {
        public String name; public int dmg, anim;
        double range, dur, kb, fwd;
        boolean launch;
        Move(String n, int d, double r, double du, double k, boolean l, int a, double f) {
            name=n;dmg=d;range=r;dur=du;kb=k;launch=l;anim=a;fwd=f;
        }
    }

    // Character data
    public static final String[] NAMES = {"RYU","KIRA","GOLEM","BLADE","BLAZE"};
    public static final String[] DESC = {"Equilibrado","Rapido","Tanque","Alcance","Especial Forte"};
    public static final int[] CHP = {100,70,160,90,80};
    public static final double[] CSPD = {180,240,120,170,190};
    public static final Color[] CC1 = {new Color(180,40,40),new Color(40,80,180),new Color(120,100,75),new Color(140,145,155),new Color(220,100,30)};
    public static final Color[] CC2 = {new Color(140,30,30),new Color(30,60,140),new Color(90,75,55),new Color(110,115,125),new Color(180,75,20)};

    static Move m(String n,int d,double r,double du,double k,boolean l,int a,double f){return new Move(n,d,r,du,k,l,a,f);}

    public static final Move[][] COMBOS = {
        {m("Jab",8,42,.12,50,false,0,35),m("Cross",12,45,.16,80,false,0,25),m("Roundhouse",18,55,.22,150,true,1,45)},
        {m("Q.Slash",6,48,.08,35,false,2,30),m("Slash",7,48,.09,40,false,2,28),m("D.Slash",10,52,.1,60,false,2,25),m("Spin",16,55,.18,130,true,1,40)},
        {m("Smash",20,52,.28,120,false,3,20),m("Bear Hug",30,48,.35,80,false,3,0)},
        {m("Cut",11,58,.14,60,false,2,35),m("Cut",13,58,.14,70,false,2,30),m("Sweep",20,68,.22,140,true,2,40)},
        {m("F.Jab",9,44,.12,55,false,0,35),m("F.Cross",12,46,.14,65,false,0,28),m("F.Kick",17,55,.22,140,true,1,45)}
    };

    public static final Move[] SPECIALS = {
        m("Hadouken",38,120,.42,220,true,5,0),
        m("Shadow Dance",32,90,.38,120,false,6,120),
        m("Earthquake",55,160,.5,280,true,3,0),
        m("Blade Storm",48,120,.48,200,true,2,0),
        m("Inferno",42,130,.42,220,true,5,0)
    };

    public Player(double x, double y, int ct) {
        this.x = x; this.y = y; ctype = ct;
        hp = CHP[ct]; maxHp = CHP[ct];
    }

    public void update(Game g) {
        double spd = CSPD[ctype];
        boolean inA = curMove != null && moveTimer > 0;
        if (dashing) { dashT -= g.dt; if (dashT <= 0) dashing = false; }

        if (!inA && !dashing) {
            double mx = 0, my = 0;
            if (g.held[Game.VK_A] || g.held[Game.VK_LEFT]) mx--;
            if (g.held[Game.VK_D] || g.held[Game.VK_RIGHT]) mx++;
            if (g.held[Game.VK_W] || g.held[Game.VK_UP]) my--;
            if (g.held[Game.VK_S] || g.held[Game.VK_DOWN]) my++;
            vx = mx * spd; vy = my * spd * .6;
            if (mx != 0) face = mx > 0 ? 1 : -1;
        } else if (inA) { if (curMove.fwd <= 0) { vx *= .86; vy *= .86; } }

        // Dash
        dashCD -= g.dt;
        if (g.just[Game.VK_SHIFT] && abilities[1] && dashCD <= 0 && !inA) {
            dashing = true; dashT = .18; dashCD = .6; vx = face * 500; vy = 0; invT = .2;
            for (int i = 0; i < 6; i++)
                g.particles.add(new streetbrawler.effects.Particle(x, y, -face*(80+Math.random()*150), (Math.random()-.5)*60, new Color(180,180,255), .3));
        }

        // Attack input
        if (g.just[Game.VK_C] && sp >= 100 && curMove == null) doSpecial(g);
        else if (g.just[Game.VK_Z] || g.just[Game.VK_X]) {
            if (curMove != null && moveTimer > 0) atkBuf = true;
            else doCombo(g);
        }

        // Move update
        if (curMove != null) {
            moveTimer -= g.dt;
            if (moveTimer <= 0) {
                curMove = null; vx *= .4;
                if (atkBuf) { atkBuf = false; doCombo(g); }
            } else if (!moveHit) {
                double pr = 1 - moveTimer / curMove.dur;
                if (pr > .12 && pr < .65) checkHit(g);
            }
        }
        comboWin -= g.dt;
        if (comboWin <= 0) comboIdx = 0;

        x += vx * g.dt; y += vy * g.dt;
        y = clamp(y, FTOP, FBOT); x = clamp(x, 28, g.stage.stageLen - 28);
        wf += Math.abs(vx) > 12 ? g.dt * 10 : -wf * .2;
        if (invT > 0) invT -= g.dt;
        rage = abilities[4] && g.combo > 10;
    }

    void doCombo(Game g) {
        Move[] ch = COMBOS[ctype];
        if (comboWin > 0 && comboIdx > 0 && comboIdx < ch.length) { startMove(ch[comboIdx]); comboIdx++; }
        else { comboIdx = 0; startMove(ch[0]); comboIdx = 1; }
        comboWin = .45;
    }

    void doSpecial(Game g) {
        sp = 0; startMove(SPECIALS[ctype]);
        // Create projectile for ranged specials
        if (ctype == 0 || ctype == 4) {
            Color c1 = ctype == 0 ? new Color(90,175,255) : new Color(255,100,20);
            Color c2 = ctype == 0 ? new Color(140,215,255) : new Color(255,200,50);
            g.projectiles.add(new Projectile(x + face * 30, y - 30, face, SPECIALS[ctype].dmg, c1, c2));
        }
        comboIdx = 0; comboWin = 0; atkBuf = false;
    }

    void startMove(Move m) {
        curMove = m; moveTimer = m.dur; moveHit = false;
        if (m.fwd > 0) { vx = face * m.fwd / m.dur; vy = 0; }
    }

    void checkHit(Game g) {
        if (curMove == null) return;
        double hx = x + face * curMove.range * .7;
        int base = curMove.dmg;
        if (rage) base *= 2;
        boolean isSpecial = curMove == SPECIALS[ctype];
        for (Enemy en : g.enemies) {
            if (en.dead) continue;
            if (inRange(hx, y, en.x, en.y, curMove.range, 40)) {
                moveHit = true; en.hurt(base, face, g, curMove.launch); onHit(g, en.x, en.y); if (!isSpecial) break;
            }
        }
        if (!moveHit || isSpecial) {
            for (Boss b : g.bosses) {
                if (b.dead) continue;
                if (inRange(hx, y, b.x, b.y, curMove.range + b.hw, 60)) {
                    moveHit = true; b.hurt(base, face, g); onHit(g, b.x, b.y); if (!isSpecial) break;
                }
            }
        }
    }

    void onHit(Game g, double hx, double hy) {
        g.combo++; g.comboTime = 1.5;
        if (g.combo > g.maxCombo) g.maxCombo = g.combo;
        g.score += 100 * g.combo;
        sp = Math.min(100, sp + (curMove == SPECIALS[ctype] ? 0 : 12));
        g.spawnHit(hx, hy - 30, curMove.launch || curMove == SPECIALS[ctype]);
        if (ctype == 2) g.shake(4, .08);
        g.hitPause = .03;
    }

    public void hurt(int d, int dir, Game g) {
        if (invT > 0 || dashing) return;
        hp -= d; invT = .5; vx = dir * 200; vy = 0; curMove = null; moveTimer = 0; g.combo = 0;
        for (int i = 0; i < 5; i++)
            g.particles.add(new streetbrawler.effects.Particle(x, y, (Math.random()-.5)*150, (Math.random()-1)*100, new Color(255,50,50), .3));
    }

    public void render(Graphics2D g) {
        AffineTransform base = g.getTransform();
        double sc = depthScale((int)y);
        g.translate(x, y); g.scale(face * sc, sc);
        if (invT > 0 && ((int)(invT * 12) & 1) == 1) { g.setTransform(base); return; }

        int ib = (int)(Math.abs(vx) > 12 ? Math.sin(wf) * 3 : 0);
        Color c1 = rage ? new Color(Math.min(255, CC1[ctype].getRed()+60), CC1[ctype].getGreen(), CC1[ctype].getBlue()) : CC1[ctype];
        Color c2 = CC2[ctype];
        boolean atk = curMove != null && moveTimer > 0;
        int an = atk ? curMove.anim : -1;
        double pr = atk ? 1 - moveTimer / curMove.dur : 0;
        double ext = atk ? Math.min(1, pr * 3) : 0;
        AffineTransform l;

        if (rage) { g.setColor(new Color(255, 50, 20, 35)); g.fillOval(-25, -65, 50, 75); }
        g.setColor(new Color(0, 0, 0, 50)); g.fillOval(-18, -2, 36, 8);

        // Legs
        double la = !atk && Math.abs(vx) > 12 ? Math.sin(wf) * .4 : 0;
        if (atk && an == 1) la = -ext * .8;
        g.setColor(c2);
        l = g.getTransform(); g.translate(-5, -5); g.rotate(-la); g.fillRoundRect(-5, 0, 10, 24, 4, 4); g.setTransform(l);
        l = g.getTransform(); g.translate(5, -5); g.rotate(la); g.fillRoundRect(-5, 0, 10, 24, 4, 4); g.setTransform(l);

        // Torso
        g.setColor(c1); g.fillRoundRect(-13, -44+ib, 26, 36, 6, 6);
        g.setColor(c2); g.fillRect(-13, -10+ib, 26, 3);
        if (ctype == 2) { g.setColor(new Color(100,85,65)); g.fillRect(-14,-14+ib,28,6); }
        if (ctype == 3) { g.setColor(new Color(160,165,175)); g.fillRect(-10,-42+ib,20,8); }

        // Arms
        Color sk = new Color(215, 175, 130);
        if (atk) renderAtk(g, an, ext, sk, c1, c2, ib, pr);
        else {
            double as = Math.abs(vx) > 12 ? Math.sin(wf + Math.PI) * .3 : 0;
            l = g.getTransform(); g.setColor(sk); g.translate(-10,-36+ib); g.rotate(as); g.fillRoundRect(-4,0,8,20,3,3); g.setTransform(l);
            l = g.getTransform(); g.translate(12,-36+ib); g.rotate(-.5+as*.5); g.fillRoundRect(-3,0,8,18,3,3); g.fillOval(-4,15,9,9); g.setTransform(l);
        }

        // Head
        g.setColor(sk); g.fillOval(-11, -60+ib, 22, 22);
        renderHead(g, ib);
        g.setColor(Color.WHITE); g.fillOval(2, -52+ib, 6, 5);
        g.setColor(Color.BLACK); g.fillOval(3, -51+ib, 4, 4);
        g.setTransform(base);
    }

    void renderAtk(Graphics2D g, int an, double ext, Color sk, Color c1, Color c2, int ib, double pr) {
        AffineTransform l;
        switch (an) {
            case 0: // punch
                l=g.getTransform();g.setColor(sk);g.translate(11,-36+ib);g.fillRoundRect(0,-3,(int)(22+ext*18),7,3,3);g.setTransform(l);
                l=g.getTransform();g.setColor(ctype==4?new Color(255,100,30):c1.brighter());g.translate(28+ext*15,-40+ib);g.fillOval(0,0,14,14);g.setTransform(l);
                l=g.getTransform();g.setColor(sk);g.translate(-9,-36+ib);g.fillRoundRect(-15,-3,15,7,3,3);g.setTransform(l);break;
            case 1: // kick
                l=g.getTransform();g.setColor(sk);g.translate(5,-8);g.rotate(-.6-ext*.5);g.fillRoundRect(0,-4,(int)(28+ext*15),9,4,4);g.setTransform(l);
                l=g.getTransform();g.setColor(ctype==4?new Color(255,80,20):c2);g.translate(28+ext*20,-25+(int)(ext*10));g.fillRoundRect(0,0,14,12,3,3);g.setTransform(l);
                l=g.getTransform();g.setColor(sk);g.translate(-9,-36+ib);g.fillRoundRect(-15,-3,15,7,3,3);g.setTransform(l);break;
            case 2: // slash
                l=g.getTransform();g.setColor(sk);g.translate(11,-36+ib);g.rotate(-ext*1.5);g.fillRoundRect(0,-3,30,7,3,3);g.setTransform(l);
                g.setColor(new Color(ctype==3?200:100,ctype==3?210:170,255,(int)(ext*160)));g.setStroke(new BasicStroke(3));
                l=g.getTransform();g.translate(20,-38+ib);g.rotate(-ext*1.5);g.drawLine(0,0,30,0);g.setStroke(new BasicStroke(1));g.setTransform(l);break;
            case 3: // heavy
                l=g.getTransform();g.setColor(sk);g.translate(8,-40+ib);g.rotate(-.4+ext*.3);g.fillRoundRect(0,-5,32,11,5,5);g.setTransform(l);
                l=g.getTransform();g.translate(-8,-40+ib);g.rotate(.4-ext*.3);g.fillRoundRect(-32,-5,32,11,5,5);g.setTransform(l);
                if(ext>.5){g.setColor(new Color(255,200,100,(int)(ext*140)));g.fillOval(15,-45+ib,(int)(ext*30),(int)(ext*30));}break;
            case 4: // uppercut
                l=g.getTransform();g.setColor(sk);g.translate(8,-40+ib);g.rotate(-1.2*ext);g.fillRoundRect(0,-4,(int)(20+ext*15),9,4,4);g.setTransform(l);
                l=g.getTransform();g.setColor(c1.brighter());g.translate(22,-55-ext*20+ib);g.fillOval(0,0,14,14);g.setTransform(l);
                g.setColor(new Color(255,200,50,(int)(ext*80)));g.drawLine(12,-35+ib,22,-55-(int)(ext*20)+ib);break;
            case 5: // energy
                l=g.getTransform();g.setColor(sk);g.translate(11,-36+ib);g.fillRoundRect(0,-3,28,7,3,3);g.setTransform(l);
                l=g.getTransform();g.translate(11,-26+ib);g.fillRoundRect(0,-3,28,7,3,3);g.setTransform(l);
                Color ec=ctype==4?new Color(255,100,20):ctype==0?new Color(90,175,255):new Color(200,200,255);
                g.setColor(new Color(ec.getRed(),ec.getGreen(),ec.getBlue(),(int)(ext*180)));g.fillOval(32,-50+ib,(int)(20+ext*25),(int)(20+ext*25));
                g.setColor(new Color(ec.getRed(),ec.getGreen(),ec.getBlue(),(int)(ext*70)));g.fillOval(28,-54+ib,(int)(28+ext*30),(int)(28+ext*30));break;
            case 6: // rapid
                for(int i=0;i<4;i++){double ph=pr*4+i*.25;if(ph>1)continue;l=g.getTransform();g.setColor(sk);g.translate(8+i*5,-36+ib);g.rotate(Math.sin(ph*Math.PI*2)*.5);g.fillRoundRect(0,-3,25,7,3,3);g.setTransform(l);}
                g.setColor(new Color(150,200,255,(int)(120*ext)));for(int i=0;i<3;i++){int sx=20+i*12;g.drawLine(sx,-45+ib,sx+15,-40+ib);}break;
        }
    }

    void renderHead(Graphics2D g, int ib) {
        switch (ctype) {
            case 0: g.setColor(new Color(38,28,18));g.fillRoundRect(-12,-63+ib,24,11,7,7);
                g.setColor(new Color(195,45,45));g.fillRect(-13,-55+ib,26,3);g.fillRect(-13,-55+ib,3,11);break;
            case 1: g.setColor(new Color(38,28,18));g.fillRoundRect(-12,-63+ib,24,10,7,7);g.fillRect(8,-62+ib,4,30);break;
            case 2: g.setColor(new Color(180,150,120));g.fillRoundRect(-12,-64+ib,24,10,8,8);break;
            case 3: g.setColor(new Color(38,28,18));g.fillRoundRect(-12,-63+ib,24,10,7,7);break;
            case 4: g.setColor(new Color(200,100,20));g.fillRoundRect(-12,-64+ib,24,12,7,7);
                g.fillPolygon(new int[]{-8,-2,-4},new int[]{-64+ib,-76+ib,-64+ib},3);
                g.fillPolygon(new int[]{2,8,4},new int[]{-64+ib,-74+ib,-64+ib},3);break;
        }
    }
}