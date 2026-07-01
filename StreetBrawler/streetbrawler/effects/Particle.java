package streetbrawler.effects;
import java.awt.*;

public class Particle {
    public double x, y, vx, vy, life, maxLife;
    public Color color;

    public Particle(double x, double y, double vx, double vy, Color c, double l) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = c; life = maxLife = l;
    }

    public void update(double dt) {
        x += vx * dt; y += vy * dt; vy += 420 * dt; life -= dt;
    }

    public boolean isDead() { return life <= 0; }

    public void render(Graphics2D g) {
        float a = (float)(life / maxLife);
        int s = (int)(3 + a * 3);
        g.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), (int)(a * 255)));
        g.fillOval((int)x - s / 2, (int)y - s / 2, s, s);
    }
}