package streetbrawler.effects;
import java.awt.*;

public class HitEffect {
    public double x, y, t = 0, dur;
    public String kind;

    public HitEffect(double x, double y, boolean big) {
        this.x = x; this.y = y;
        dur = big ? .38 : .22; kind = big ? "big" : "small";
    }

    public HitEffect(double x, double y, String k) {
        this.x = x; this.y = y; kind = k; dur = .7;
    }

    public void tick(double dt) { t += dt; }
    public boolean isDone() { return t >= dur; }

    public void render(Graphics2D g) {
        float p = (float)(t / dur), a = 1f - p;
        if (kind.equals("big")) {
            int s = (int)(42 + p * 65);
            g.setColor(new Color(90, 195, 255, (int)(a * 140)));
            g.fillOval((int)(x - s / 2), (int)(y - s / 2), s, s);
            g.setColor(new Color(190, 235, 255, (int)(a * 190)));
            g.setStroke(new BasicStroke(3));
            int s2 = (int)(s * .65);
            g.drawOval((int)(x - s2 / 2), (int)(y - s2 / 2), s2, s2);
            g.setStroke(new BasicStroke(1));
        } else if (kind.equals("heal")) {
            g.setColor(new Color(45, 255, 95, (int)(a * 220)));
            g.setFont(new Font("Arial", Font.BOLD, 16));
            g.drawString("+HP", (int)(x - 14), (int)(y - p * 38));
        } else {
            int s = (int)(18 + p * 32);
            g.setColor(new Color(255, 255, 195, (int)(a * 190)));
            g.fillOval((int)(x - s / 2), (int)(y - s / 2), s, s);
            g.setColor(new Color(255, 195, 45, (int)(a * 240)));
            g.setStroke(new BasicStroke(2.5f));
            for (int i = 0; i < 4; i++) {
                double ang = i * Math.PI / 2 + p * 2.2;
                int l = (int)(14 + p * 22);
                g.drawLine((int)x, (int)y, (int)(x + Math.cos(ang) * l), (int)(y + Math.sin(ang) * l));
            }
            g.setStroke(new BasicStroke(1));
        }
    }
}