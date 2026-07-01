package streetbrawler.entities;

import java.awt.*;
import java.awt.geom.AffineTransform;
import streetbrawler.Game;
import static streetbrawler.utils.MathUtils.*;
import static streetbrawler.world.Collision.*;

public class Boss {
    public double x, y, vx, vy;
    public int type, face = -1, hp, maxHp, hw;
    public boolean dead = false, atk = false, mHit = false;
    public double dTimer = 2, atkT = 0, aiCD = 1.5, wf = 0, stun = 0, flashT = 0;
    public int atkType = 0;

    public static final String[] NAMES = {"GORGO", "VIPER", "IRON MIKE", "SHADOW", "TITAN"};
    public static final int[] BHP = {200, 260, 380, 300, 500};
    public static final int[] BDMG = {20, 18, 25, 22, 35};
    public static final int[] WAVES = {3, 6, 9, 12, 15};
    public static final Color[] BC1 = {new Color(90,65,50),new Color(40,130,45),new Color(110,110,120),new Color(55,30,75),new Color(160,35,35)};
    public static final Color[] BC2 = {new Color(70,50,40),new Color(30,100,35),new Color(85,85,95),new Color(40,20,55),new Color(120,25,25)};
    public static final String[] UNLOCK = {"PULO DUPLO", "DASH [Shift]", "UPPERCUT [Frente+Z]", "COMBO AEREO [X no ar]", "MODO FURIA"};

    public Boss(double x, double y, int t) {
        this.x = x; this.y = y; type = t;
        hp = maxHp = BHP[t]; hw = 35 + t * 3;
    }

    public void update(Game g) {
        if (dead) { dTimer -= g.dt; vy += 500 * g.dt; y += vy * g.dt; if (y > FBOT) { y = FBOT; vy = 0; } return; }
        if (flashT > 0) flashT -= g.dt;
        if (stun > 0) { stun -= g.dt; vx *= .85; x += vx * g.dt; return; }
        double dx = g.player.x - x, dy = g.player.y - y, dist = Math.abs(dx);
        face = dx > 0 ? 1 : -1; aiCD -= g.dt;
        if (Math.abs(dy) > 25) vy = dy > 0 ? 60 + type * 8 : -(60 + type * 8); else vy *= .8;
        if (atk) {
            atkT -= g.dt; if (atkType == 1) vx = face * 400; else vx *= .82;
            if (atkT <= 0) { atk = false; if (!mHit && inRange(x, y, g.player.x, g.player.y, 70, 60)) { g.player.hurt(BDMG[type], face, g); mHit = true; } if (atkType == 1) g.shake(6, .1); }
        } else if (aiCD <= 0) {
            if (dist < 65 && Math.abs(dy) < 60) { atk = true; atkType = 0; atkT = .35; mHit = false; aiCD = .8; vx = face * 80; }
            else if (dist < 300 && Math.random() < .3) { atk = true; atkType = 1; atkT = .4; mHit = false; aiCD = 1.5; }
            else { vx = face * (70 + type * 10); aiCD = .1; }
        } else {
            if (dist > 400) vx = face * (90 + type * 8); else if (dist > 60) vx = face * (55 + type * 5); else vx *= .9;
        }
        wf += Math.abs(vx) > 12 ? g.dt * 6 : -wf * .12;
        x += vx * g.dt; y += vy * g.dt;
        y = clamp(y, FTOP, FBOT); x = clamp(x, 50, g.stage.stageLen - 50);
    }

    public void hurt(int d, int dir, Game g) {
        hp -= d; stun = .15; vx = dir * 100; flashT = .1;
        if (hp <= 0) {
            dead = true; dTimer = 2; vy = -350; vx = dir * 150;
            g.bossDefeated[type] = true; g.bossActive = false;
            g.score += (type + 1) * 1000;
            g.addNotif("BOSS DERROTADO: " + NAMES[type] + "!", new Color(255, 215, 0));
            g.addNotif("DESBLOQUEADO: " + UNLOCK[type], new Color(100, 255, 100));
            g.shake(15, .4);
            for (int i = 0; i < 30; i++)
                g.particles.add(new streetbrawler.effects.Particle(x + (Math.random()-.5)*80, y-40, (Math.random()-.5)*300, (Math.random()-1)*250, new Color(255, (int)(150+Math.random()*105), 30), .5+Math.random()*.5));
        }
    }

    public void render(Graphics2D g) {
        AffineTransform base = g.getTransform();
        double sc = depthScale((int)y) * (1.4 + type * .1);
        g.translate(x, y); g.scale(face * sc, sc);
        if (dead) g.rotate(Math.min((2 - dTimer) * 1.5, Math.PI / 2));
        int ib = (int)(Math.sin(wf) * 3);
        Color c1 = flashT > 0 ? new Color(255, 200, 200) : BC1[type];
        Color c2 = flashT > 0 ? new Color(255, 180, 180) : BC2[type];
        AffineTransform l;

        g.setColor(new Color(0, 0, 0, 55)); g.fillOval(-22, -2, 44, 10);
        double la = Math.abs(vx) > 10 && !dead ? Math.sin(wf) * .4 : 0;
        g.setColor(c2);
        l = g.getTransform(); g.translate(-6, -5); g.rotate(-la); g.fillRoundRect(-5, 0, 11, 26, 4, 4); g.setTransform(l);
        l = g.getTransform(); g.translate(6, -5); g.rotate(la); g.fillRoundRect(-5, 0, 11, 26, 4, 4); g.setTransform(l);
        g.setColor(c1); g.fillRoundRect(-16, -48 + ib, 32, 40, 8, 8);
        g.setColor(c2); g.fillRect(-16, -10 + ib, 32, 4);
        switch (type) {
            case 0: g.setColor(new Color(120,90,60)); g.fillRect(-18,-12+ib,36,8); break;
            case 1: g.setColor(new Color(25,80,25)); g.drawLine(-14,-45+ib,-14,-12+ib); g.drawLine(14,-45+ib,14,-12+ib); break;
            case 2: g.setColor(new Color(140,140,150)); g.fillRect(-17,-46+ib,34,8); g.fillRect(-17,-30+ib,34,8); break;
            case 3: g.setColor(new Color(30,15,50,100)); g.fillOval(-20,-52+ib,40,48); break;
            case 4: g.setColor(new Color(200,50,50)); g.fillRect(-2,-44+ib,4,28); g.fillRect(-8,-36+ib,16,4); break;
        }
        Color sk = new Color(180, 145, 110);
        if (atk && atkType == 0) {
            l = g.getTransform(); g.setColor(sk); g.translate(13, -38+ib); g.fillRoundRect(0,-4,34,9,4,4); g.setTransform(l);
            l = g.getTransform(); g.setColor(c1.brighter()); g.translate(42,-42+ib); g.fillOval(0,0,16,16); g.setTransform(l);
        } else if (atk && atkType == 1) {
            l = g.getTransform(); g.setColor(sk); g.translate(12,-36+ib); g.fillRoundRect(0,-3,28,7,3,3); g.setTransform(l);
            l = g.getTransform(); g.translate(-12,-36+ib); g.fillRoundRect(-28,-3,28,7,3,3); g.setTransform(l);
        } else {
            l = g.getTransform(); g.setColor(sk); g.translate(-12,-38+ib); g.fillRoundRect(-4,0,9,22,4,4); g.setTransform(l);
            l = g.getTransform(); g.translate(13,-38+ib); g.rotate(-.3); g.fillRoundRect(0,-3,22,8,3,3); g.fillOval(18,-2,12,12); g.setTransform(l);
        }
        g.setColor(sk); g.fillOval(-13, -64+ib, 26, 26);
        switch (type) {
            case 0: g.setColor(new Color(160,130,100)); g.fillRoundRect(-14,-68+ib,28,12,8,8); g.setColor(new Color(120,40,40)); g.drawLine(-8,-58+ib,4,-52+ib); break;
            case 1: g.setColor(new Color(30,80,30)); g.fillRoundRect(-15,-70+ib,30,18,10,10); break;
            case 2: g.setColor(new Color(50,50,55)); g.fillRoundRect(-14,-68+ib,28,12,6,6); break;
            case 3: g.setColor(new Color(35,20,50)); g.fillRoundRect(-14,-66+ib,28,14,8,8); g.setColor(new Color(180,50,255,120)); g.fillOval(-6,-58+ib,5,4); g.fillOval(2,-58+ib,5,4); break;
            case 4: g.setColor(new Color(120,25,25)); g.fillRoundRect(-14,-68+ib,28,12,8,8); g.fillRect(-14,-78+ib,5,14); g.fillRect(9,-78+ib,5,14); break;
        }
        g.setColor(type == 3 ? new Color(180,50,255) : Color.WHITE); g.fillOval(-6,-56+ib,7,6); g.fillOval(1,-56+ib,7,6);
        g.setColor(type == 3 ? new Color(255,100,255) : Color.BLACK); g.fillOval(-5,-55+ib,5,5); g.fillOval(2,-55+ib,5,5);
        g.setTransform(base);
    }
}
