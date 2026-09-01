package streetbrawler.ui;

import java.awt.*;
import java.util.Random;
import static streetbrawler.utils.MathUtils.*;

public class Menu {
    public void render(Graphics2D g) {
        g.setColor(new Color(10,8,25)); g.fillRect(0,0,W,H);
        Random r = new Random(99);
        for (int x = 0; x < W; x += r.nextInt(70)+35) {
            int h = r.nextInt(180)+80;
            g.setColor(new Color(18,16,40)); g.fillRect(x,H-h,r.nextInt(55)+25,h);
        }
        long t = System.currentTimeMillis();
        float pulse = (float)(Math.sin(t/300.0)*.5+.5);
        g.setFont(new Font("Impact",Font.BOLD,74));
        g.setColor(new Color(0,0,0,140)); g.drawString("STREET BRAWLER",W/2-242,198);
        g.setColor(new Color(255,(int)(80+pulse*80),30)); g.drawString("STREET BRAWLER",W/2-240,196);
        g.setFont(new Font("Arial",Font.BOLD,18)); g.setColor(new Color(180,180,180));
        g.drawString("Beat 'Em Up Arcade  |  4 Direcoes",W/2-140,245);
        g.setFont(new Font("Arial",Font.PLAIN,15)); g.setColor(new Color(140,140,140));
        String[] ctrl = {"WASD ou Setas = Mover (todas direcoes)","Z = Ataque (combo encadeado!)","X = Ataque alternativo","C = Especial (barra cheia)"};
        for (int i = 0; i < ctrl.length; i++) g.drawString(ctrl[i],W/2-135,295+i*26);
        if ((t/500)%2==0) {
            g.setFont(new Font("Arial",Font.BOLD,22)); g.setColor(new Color(255,200,50));
            g.drawString("ENTER para jogar!",W/2-108,H-55);
        }
    }
}
