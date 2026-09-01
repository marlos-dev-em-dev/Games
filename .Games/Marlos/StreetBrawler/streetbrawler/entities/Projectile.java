package streetbrawler.entities;
import java.awt.*;
import static streetbrawler.utils.MathUtils.*;

public class Projectile {
    public double x, y, vx;
    public int dmg, face;
    public boolean dead = false;
    public double life = 2.0;
    private Color c1, c2;
    private double pulseT = 0;

    public Projectile(double x, double y, int face, int dmg, Color c1, Color c2) {
        this.x = x; this.y = y; this.face = face;
        this.dmg = dmg; this.c1 = c1; this.c2 = c2;
        vx = face * 400;
    }

    public void update(double dt, double stageLen) {
        x += vx * dt; life -= dt; pulseT += dt * 12;
        if (x < -50 || x > stageLen + 50 || life <= 0) dead = true;
    }

    public void render(Graphics2D g) {
        double sc = depthScale((int)y);
        int ix = (int)x, iy = (int)y;
        float pulse = (float)(Math.sin(pulseT) * .3 + .7);
        int r = (int)(16 * sc);
        g.setColor(new Color(c1.getRed(), c1.getGreen(), c1.getBlue(), (int)(60 * pulse)));
        g.fillOval(ix - r - 4, iy - r - 4, (r + 4) * 2, (r + 4) * 2);
        g.setColor(new Color(c2.getRed(), c2.getGreen(), c2.getBlue(), (int)(140 * pulse)));
        g.fillOval(ix - r, iy - r, r * 2, r * 2);
        g.setColor(new Color(255, 255, 255, (int)(200 * pulse)));
        g.fillOval(ix - r / 2, iy - r / 2, r, r);
    }
}