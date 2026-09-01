package streetbrawler.ui;
import java.awt.*;
import streetbrawler.entities.Player;
import static streetbrawler.utils.MathUtils.*;

public class CharacterSelect {

    public void render(Graphics2D g, int sel) {
        g.setColor(new Color(12,10,28)); g.fillRect(0,0,W,H);
        g.setFont(new Font("Impact",Font.BOLD,42)); g.setColor(new Color(255,200,50));
        String title = "ESCOLHA SEU LUTADOR";
        g.drawString(title, W/2 - g.getFontMetrics().stringWidth(title)/2, 55);

        for (int i = 0; i < 5; i++) {
            int cx = 96 + i * 176;
            boolean selected = i == sel;
            if (selected) {
                g.setColor(new Color(255,200,50,40)); g.fillRoundRect(cx-70,75,140,420,12,12);
                g.setColor(new Color(255,200,50)); g.setStroke(new BasicStroke(3));
                g.drawRoundRect(cx-70,75,140,420,12,12); g.setStroke(new BasicStroke(1));
            } else {
                g.setColor(new Color(30,28,50)); g.fillRoundRect(cx-70,75,140,420,12,12);
            }
            g.translate(cx, 290); drawPreview(g, i); g.translate(-cx, -290);

            g.setFont(new Font("Impact",Font.BOLD,selected?22:18));
            g.setColor(selected ? new Color(255,200,50) : new Color(180,180,180));
            g.drawString(Player.NAMES[i], cx - g.getFontMetrics().stringWidth(Player.NAMES[i])/2, 100);
            g.setFont(new Font("Arial",Font.PLAIN,11)); g.setColor(new Color(140,140,140));
            g.drawString(Player.DESC[i], cx-30, 125);

            statBar(g, cx-45, 410, 90, Player.CHP[i], 160, new Color(40,190,70), "HP:"+Player.CHP[i]);
            statBar(g, cx-45, 436, 90, (int)Player.CSPD[i], 340, new Color(50,120,220), "SPD:"+((int)Player.CSPD[i]));
            statBar(g, cx-45, 462, 90, Player.COMBOS[i][0].dmg * Player.COMBOS[i].length, 60, new Color(220,80,40), "COMBO:"+Player.COMBOS[i].length+" hits");

            // Combo chain display
            StringBuilder cb = new StringBuilder();
            for (int j = 0; j < Player.COMBOS[i].length; j++) {
                if (j > 0) cb.append(" > ");
                cb.append(Player.COMBOS[i][j].name);
            }
            g.setFont(new Font("Arial",Font.PLAIN,9)); g.setColor(new Color(110,110,140));
            String cs = cb.toString();
            int mw = g.getFontMetrics().stringWidth(cs);
            if (mw > 130) {
                g.drawString(cs.substring(0, Math.min(20, cs.length())), cx-55, 484);
                if (cs.length() > 20) g.drawString(cs.substring(20), cx-55, 496);
            } else g.drawString(cs, cx-mw/2, 484);
        }
        g.setFont(new Font("Arial",Font.PLAIN,14)); g.setColor(new Color(120,120,120));
        g.drawString("< A/D ou Setas >    ENTER para selecionar", W/2-190, H-15);
    }

    void statBar(Graphics2D g, int x, int y, int w, int val, int max, Color c, String lb) {
        g.setColor(new Color(40,40,40)); g.fillRoundRect(x,y,w,7,4,4);
        g.setColor(c); g.fillRoundRect(x,y,(int)(w*(double)val/max),7,4,4);
        g.setFont(new Font("Arial",Font.BOLD,9)); g.setColor(new Color(160,160,160)); g.drawString(lb,x,y+16);
    }

    void drawPreview(Graphics2D g, int ci) {
        Color c1 = Player.CC1[ci], c2 = Player.CC2[ci];
        Color sk = new Color(215,175,130);
        g.setColor(new Color(0,0,0,50)); g.fillOval(-25,68,50,12);
        g.setColor(c2); g.fillRoundRect(-12,30,10,35,4,4); g.fillRoundRect(2,30,10,35,4,4);
        g.setColor(c1); g.fillRoundRect(-18,-25,36,52,8,8);
        g.setColor(c2); g.fillRect(-18,20,36,4);
        g.setColor(sk);
        g.fillRoundRect(-26,-20,9,28,4,4); g.fillRoundRect(17,-20,9,28,4,4);
        g.fillOval(-27,6,11,11); g.fillOval(16,6,11,11);
        g.fillOval(-14,-52,28,28);
        switch (ci) {
            case 0: g.setColor(new Color(38,28,18));g.fillRoundRect(-15,-57,30,14,7,7);
                g.setColor(new Color(195,45,45));g.fillRect(-16,-40,32,4);g.fillRect(-16,-40,4,14);break;
            case 1: g.setColor(new Color(38,28,18));g.fillRoundRect(-14,-57,28,12,7,7);g.fillRect(10,-55,5,35);break;
            case 2: g.setColor(new Color(180,150,120));g.fillRoundRect(-15,-57,30,12,8,8);
                g.setColor(new Color(100,85,65));g.fillRect(-20,-22,40,5);break;
            case 3: g.setColor(new Color(38,28,18));g.fillRoundRect(-14,-57,28,12,7,7);
                g.setColor(new Color(180,185,195));g.fillRect(22,-50,3,55);
                g.setColor(new Color(100,50,30));g.fillRect(20,2,7,10);break;
            case 4: g.setColor(new Color(200,100,20));g.fillRoundRect(-14,-57,28,14,7,7);
                g.fillPolygon(new int[]{-12,-6,-8},new int[]{-57,-72,-57},3);
                g.fillPolygon(new int[]{-2,4,2},new int[]{-57,-75,-57},3);
                g.fillPolygon(new int[]{8,14,10},new int[]{-57,-68,-57},3);break;
        }
        g.setColor(Color.WHITE); g.fillOval(-8,-44,8,6); g.fillOval(2,-44,8,6);
        g.setColor(Color.BLACK); g.fillOval(-6,-43,5,5); g.fillOval(4,-43,5,5);
    }
}