package streetbrawler.ui;
import java.awt.*;
import java.util.*;
import streetbrawler.Game;
import streetbrawler.entities.*;
import static streetbrawler.utils.MathUtils.*;

public class HUD {

    public void render(Graphics2D g, Game game) {
        Player p = game.player;

        // Player HP
        g.setColor(new Color(0,0,0,170)); g.fillRoundRect(14,14,256,32,10,10);
        g.setFont(new Font("Arial",Font.BOLD,13)); g.setColor(new Color(200,200,200)); g.drawString("HP",20,36);
        double r = (double)p.hp / p.maxHp;
        g.setColor(new Color(55,18,18)); g.fillRoundRect(42,19,214,20,8,8);
        g.setColor(r>.5?new Color(40,190,70):r>.25?new Color(210,170,30):new Color(210,35,35));
        g.fillRoundRect(42,19,(int)(214*Math.max(0,r)),20,8,8);
        g.setColor(new Color(255,255,255,35)); g.fillRoundRect(42,19,(int)(214*Math.max(0,r)),9,8,8);

        // Special bar
        g.setColor(new Color(0,0,0,160)); g.fillRoundRect(14,50,152,14,5,5);
        g.setColor(new Color(30,75,195)); g.fillRoundRect(16,52,(int)(148*p.sp/100),10,5,5);
        g.setColor(new Color(90,155,255,70)); g.fillRoundRect(16,52,(int)(148*p.sp/100),5,5,5);
        g.setFont(new Font("Arial",Font.BOLD,9)); g.setColor(new Color(180,210,255)); g.drawString("ESPECIAL",54,61);

        // Score
        g.setFont(new Font("Arial",Font.BOLD,17)); g.setColor(new Color(255,215,70)); g.drawString("SCORE "+game.score,W-190,34);
        g.setFont(new Font("Arial",Font.PLAIN,13)); g.setColor(new Color(160,160,160));
        g.drawString("Wave "+(int)game.wave+" | "+Player.NAMES[p.ctype]+" | Kills "+game.defeated,16,80);

        // Current move name
        if (p.curMove != null && p.moveTimer > 0) {
            g.setFont(new Font("Arial",Font.BOLD,14)); g.setColor(new Color(255,255,255,200));
            String mn = p.curMove.name;
            g.drawString(mn, (int)p.x - (int)game.camera.x - g.getFontMetrics().stringWidth(mn)/2, (int)p.y - 85);
        }

        // Combo
        if (game.combo > 1) {
            int sz = Math.min(30 + game.combo * 2, 52);
            g.setFont(new Font("Impact",Font.BOLD,sz));
            float a = Math.min(1f, (float)(game.comboTime / .5));
            g.setColor(p.rage ? new Color(255,50,50,(int)(a*255)) : new Color(255,90,25,(int)(a*255)));
            String ct = game.combo + "x COMBO!" + (p.rage ? " FURIA!" : "");
            g.drawString(ct, W/2 - g.getFontMetrics().stringWidth(ct)/2, 65);
        }

        // Boss HP
        for (Boss b : game.bosses) {
            if (!b.dead) {
                int bw = 400, bx = W/2 - bw/2;
                g.setColor(new Color(0,0,0,200)); g.fillRoundRect(bx-5,88,bw+10,28,8,8);
                g.setColor(new Color(80,20,20)); g.fillRoundRect(bx,92,bw,20,6,6);
                double br = (double)b.hp / b.maxHp;
                g.setColor(new Color(200,35,35)); g.fillRoundRect(bx,92,(int)(bw*br),20,6,6);
                g.setColor(new Color(255,100,100,50)); g.fillRoundRect(bx,92,(int)(bw*br),10,6,6);
                g.setFont(new Font("Impact",Font.BOLD,16)); g.setColor(new Color(255,200,200));
                String bn = Boss.NAMES[b.type];
                g.drawString(bn, W/2 - g.getFontMetrics().stringWidth(bn)/2, 108);
            }
        }

        // Unlocked abilities
        g.setFont(new Font("Arial",Font.PLAIN,10)); int uy = 96;
        for (int i = 0; i < 5; i++) {
            if (p.abilities[i]) { g.setColor(new Color(100,255,100,180)); g.drawString("* "+Boss.UNLOCK[i],16,uy); uy+=14; }
        }

        // Notifications
        int ny = H - 80;
        for (int i = game.notifs.size()-1; i >= 0; i--) {
            var n = game.notifs.get(i);
            float a = Math.min(1f, (float)(n.t / .5));
            g.setFont(new Font("Impact",Font.BOLD,24));
            g.setColor(new Color(n.col.getRed(),n.col.getGreen(),n.col.getBlue(),(int)(a*255)));
            g.drawString(n.text, W/2 - g.getFontMetrics().stringWidth(n.text)/2, ny);
            ny -= 32;
        }
    }
}