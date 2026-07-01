package streetbrawler.entities;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.util.Random;
import streetbrawler.Game;
import static streetbrawler.utils.MathUtils.*;
import static streetbrawler.world.Collision.*;

public class Enemy {
    public double x, y, vx, vy;
    public int type, face = -1, hp, maxHp;
    public boolean dead = false, atk = false, mHit = false;
    public double dTimer = 1, atkT = 0, aiCD = 0, wf = 0, stun = 0;

    static final Color[] C1 = {new Color(55,55,55), new Color(55,95,55), new Color(95,48,48)};
    static final Color[] C2 = {new Color(48,48,65), new Color(65,65,48), new Color(55,55,55)};
    static final int[] HP = {30, 55, 90};
    static final int[] DMG = {8, 13, 20};
    static final double[] SPD = {130, 105, 75};
    static final Color[] MC1 = {new Color(90,65,50),new Color(40,130,45),new Color(110,110,120),new Color(55,30,75),new Color(160,35,35)};
    static final Color[] MC2 = {new Color(70,50,40),new Color(30,100,35),new Color(85,85,95),new Color(40,20,55),new Color(120,25,25)};
    static final int[] MHP = {80, 90, 110, 100, 150};
    static final int[] MDMG = {12, 11, 15, 13, 20};

    boolean mini() { return type >= 3; }
    Color col1() { return mini() ? MC1[type - 3] : C1[type]; }
    Color col2() { return mini() ? MC2[type - 3] : C2[type]; }
    int atkDmg() { return mini() ? MDMG[type - 3] : DMG[type]; }
    double spd() { return mini() ? 90 : SPD[type]; }

    public Enemy(double x, double y, int t) {
        this.x = x; this.y = y; type = t;
        hp = maxHp = mini() ? MHP[type - 3] : HP[type];
    }

    public void update(Game g) {
        if (dead) { dTimer -= g.dt; vy += 850 * g.dt; y += vy * g.dt; if (y > FBOT) { y = FBOT; vy = 0; } return; }
        if (stun > 0) { stun -= g.dt; vx *= .88; x += vx * g.dt; vy *= .85; y += vy * g.dt; y = clamp(y, FTOP, FBOT); return; }
        double dx = g.player.x - x, dy = g.player.y - y, dist = Math.abs(dx);
        face = dx > 0 ? 1 : -1; aiCD -= g.dt;
        double ar = type == 2 ? 58 : mini() ? 52 : 46;
        if (atk) {
            atkT -= g.dt; vx *= .82;
            if (atkT <= 0) { atk = false; if (!mHit && inRange(x, y, g.player.x, g.player.y, ar + 35, 50)) { g.player.hurt(atkDmg(), face, g); mHit = true; } }
        } else if (dist < ar && aiCD <= 0 && Math.abs(dy) < 50) {
            atk = true; atkT = mini() ? .35 : .28; mHit = false; aiCD = .5 + new Random().nextDouble() * .5; vx = face * 65;
        } else if (dist > 500) vx *= .92;
        else vx = face * spd();
        if (Math.abs(dy) > 30) vy = dy > 0 ? spd() * .5 : -spd() * .5; else vy *= .8;
        wf += Math.abs(vx) > 12 ? g.dt * 8 : -wf * .15;
        x += vx * g.dt; y += vy * g.dt; y = clamp(y, FTOP, FBOT); x = clamp(x, 28, g.stage.stageLen - 28);
    }

    public void hurt(int d, int dir, Game g, boolean launch) {
        hp -= d; stun = .2; vx = dir * 160;
        if (type == 2 || mini()) vx *= .5;
        if (launch) vy = -200;
        if (hp <= 0) {
            dead = true; dTimer = 1.1; vy = -320; vx = dir * 210;
            g.defeated++; g.score += (mini() ? type - 1 : type + 1) * 200;
            if (new Random().nextDouble() < .2) {
                g.player.hp = Math.min(g.player.maxHp, g.player.hp + 15);
                g.hitEffects.add(new streetbrawler.effects.HitEffect(x, y - 65, "heal"));
            }
        }
    }

    public void render(Graphics2D g) {
        AffineTransform base = g.getTransform();
        double sc = depthScale((int)y);
        g.translate(x, y); g.scale(face * sc, sc);
        if (dead) g.rotate(Math.min((1.1 - dTimer) * 2.5, Math.PI / 2));
        int ib = (int)(Math.sin(wf) * 2);
        Color c1 = col1(), c2 = col2();
        AffineTransform l;

        g.setColor(new Color(0, 0, 0, 40)); g.fillOval(-16, -2, 32, 7);
        double la = Math.abs(vx) > 12 && !dead ? Math.sin(wf) * .4 : 0;
        g.setColor(c2);
        l = g.getTransform(); g.translate(-5, -5); g.rotate(-la); g.fillRoundRect(-4, 0, 9, 21, 3, 3); g.setTransform(l);
        l = g.getTransform(); g.translate(5, -5); g.rotate(la); g.fillRoundRect(-4, 0, 9, 21, 3, 3); g.setTransform(l);
        int tw = type == 2 ? 30 : mini() ? 26 : 24;
        g.setColor(c1); g.fillRoundRect(-tw / 2, -40 + ib, tw, 33, 5, 5);
        Color sk = new Color(190, 155, 115);
        if (atk) {
            l = g.getTransform(); g.setColor(sk); g.translate(10, -33 + ib); g.rotate(-.25); g.fillRoundRect(0, -3, 28, 7, 3, 3); g.setTransform(l);
        } else {
            l = g.getTransform(); g.setColor(sk); g.translate(-9, -33 + ib); g.fillRoundRect(-3, 0, 7, 17, 3, 3); g.setTransform(l);
            l = g.getTransform(); g.translate(10, -33 + ib); g.rotate(-.4); g.fillRoundRect(0, -3, 20, 7, 3, 3); g.setTransform(l);
        }
        g.setColor(sk); g.fillOval(-10, -56 + ib, 20, 20);
        if (type == 0) { g.setColor(new Color(38, 38, 38)); g.fillRoundRect(-11, -59 + ib, 22, 12, 7, 7); }
        else if (type == 1) { g.setColor(new Color(145, 75, 28)); g.fillRect(-2, -65 + ib, 5, 12); }
        else if (type == 2) { g.setColor(new Color(145, 28, 28)); g.drawLine(2, -50 + ib, 7, -43 + ib); g.fillRect(-7, -40 + ib, 14, 4); }
        else {
            int bi = type - 3;
            g.setColor(c1.darker());
            switch (bi) {
                case 0: g.fillOval(-18, -26 + ib, 10, 10); g.fillOval(8, -26 + ib, 10, 10); break;
                case 1: g.fillRect(-12, -58 + ib, 24, 3); break;
                case 2: g.setColor(new Color(180, 30, 30)); g.fillOval(6, -22 + ib, 12, 12); break;
                case 3: g.setColor(new Color(40, 20, 60, 150)); g.fillRoundRect(-12, -42 + ib, 24, 34, 5, 5); break;
                case 4: g.fillRect(-10, -66 + ib, 4, 12); g.fillRect(6, -66 + ib, 4, 12); break;
            }
        }
        g.setColor(Color.WHITE); g.fillOval(1, -49 + ib, 5, 4);
        g.setColor(dead ? new Color(90, 0, 0) : Color.BLACK); g.fillOval(2, -48 + ib, 3, 3);
        if (hp < maxHp && !dead) {
            g.setColor(new Color(0, 0, 0, 130)); g.fillRect(-14, -66 + ib, 28, 3);
            g.setColor(mini() ? new Color(200, 100, 35) : new Color(195, 45, 45));
            g.fillRect(-14, -66 + ib, (int)(28.0 * hp / maxHp), 3);
        }
        g.setTransform(base);
    }
}