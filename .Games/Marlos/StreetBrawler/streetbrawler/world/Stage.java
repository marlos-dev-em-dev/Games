package streetbrawler.world;
import java.awt.*;
import java.util.*;
import static streetbrawler.utils.MathUtils.*;

public class Stage {
    public double stageLen = 10000;
    private int[][] bgBlocks; // x, h, w

    public Stage() {
        Random r = new Random(7);
        ArrayList<int[]> list = new ArrayList<>();
        for (int bx = -200; bx < (int)stageLen + 600; bx += r.nextInt(80) + 40)
            list.add(new int[]{bx, r.nextInt(120) + 60, r.nextInt(55) + 35});
        bgBlocks = list.toArray(new int[0][]);
    }

    public void render(Graphics2D g, double camX) {
        // Sky
        g.setPaint(new GradientPaint(0, 0, new Color(18, 14, 38), 0, H, new Color(50, 35, 65)));
        g.fillRect(0, 0, W, H);
        // Moon
        g.setColor(new Color(255, 240, 200, 60)); g.fillOval(W - 130, 35, 70, 70);
        g.setColor(new Color(255, 240, 200, 25)); g.fillOval(W - 140, 25, 90, 90);
        // Far buildings
        for (int[] b : bgBlocks) {
            int bx = (int)(b[0] - camX * 0.25);
            if (bx > -b[2] - 50 && bx < W + 50) {
                g.setColor(new Color(25, 22, 48));
                g.fillRect(bx, FBOT - b[1], b[2], b[1] + 200);
                g.setColor(new Color(40, 35, 65, 80));
                for (int wy = FBOT - b[1] + 8; wy < FBOT; wy += 18)
                    for (int wx = bx + 6; wx < bx + b[2] - 10; wx += 14)
                        if (((wx * 7 + wy * 3) & 3) != 0) g.fillRect(wx, wy, 7, 10);
            }
        }
        // Near buildings
        for (int[] b : bgBlocks) {
            int bx = (int)(b[0] - camX * 0.55);
            if (bx > -b[2] - 100 && bx < W + 50) {
                g.setColor(new Color(35, 30, 58));
                g.fillRect(bx, FBOT - b[1] / 2, b[2] + 15, b[1] / 2 + 200);
            }
        }
        // Ground
        g.setColor(new Color(48, 42, 38)); g.fillRect(0, FBOT, W, H - FBOT);
        g.setColor(new Color(65, 58, 50)); g.fillRect(0, FBOT, W, 3);
        // Top barrier
        g.setColor(new Color(30, 26, 48)); g.fillRect(0, FTOP - 20, W, 20);
        g.setColor(new Color(45, 40, 65)); g.fillRect(0, FTOP - 2, W, 2);
        // Ground detail
        g.setColor(new Color(58, 52, 45, 60));
        for (int lx = (int)((-camX * 0.92) % 80); lx < W; lx += 80)
            g.fillRect(lx, FBOT + 15, 38, 2);
        // Lane lines
        g.setColor(new Color(80, 75, 68, 25));
        for (int ly = FTOP + 30; ly < FBOT; ly += 40) g.drawLine(0, ly, W, ly);
    }
}