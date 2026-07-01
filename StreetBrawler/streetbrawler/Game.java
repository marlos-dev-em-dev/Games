package streetbrawler;

import java.awt.*;
import java.awt.event.*;
import java.util.*;
import java.util.List;
import streetbrawler.entities.*;
import streetbrawler.world.*;
import streetbrawler.ui.*;
import streetbrawler.effects.*;
import static streetbrawler.utils.MathUtils.*;

public class Game {
    public static final int VK_A=KeyEvent.VK_A,VK_D=KeyEvent.VK_D,VK_W=KeyEvent.VK_W,VK_S=KeyEvent.VK_S,
        VK_Z=KeyEvent.VK_Z,VK_X=KeyEvent.VK_X,VK_C=KeyEvent.VK_C,
        VK_LEFT=KeyEvent.VK_LEFT,VK_RIGHT=KeyEvent.VK_RIGHT,VK_UP=KeyEvent.VK_UP,VK_DOWN=KeyEvent.VK_DOWN,
        VK_SPACE=KeyEvent.VK_SPACE,VK_SHIFT=KeyEvent.VK_SHIFT;

    public boolean[] held = new boolean[512], just = new boolean[512];
    public double dt, hitPause = 0;
    public GameState state = GameState.TITLE;
    public int selChar = 0;

    public Player player;
    public List<Enemy> enemies = new ArrayList<>();
    public List<Boss> bosses = new ArrayList<>();
    public List<Projectile> projectiles = new ArrayList<>();
    public List<Particle> particles = new ArrayList<>();
    public List<HitEffect> hitEffects = new ArrayList<>();
    public List<Notif> notifs = new ArrayList<>();

    public int combo = 0, maxCombo = 0, score = 0, defeated = 0;
    public double comboTime = 0, spawnCD = 0, wave = 1;
    public boolean bossActive = false;
    public boolean[] bossDefeated = new boolean[5];

    public Camera camera = new Camera(10000);
    public Stage stage = new Stage();
    public ScreenShake screenShake = new ScreenShake();

    private streetbrawler.ui.Menu menu = new streetbrawler.ui.Menu();
    private CharacterSelect charSelect = new CharacterSelect();
    private HUD hud = new HUD();
    private long lastNano = System.nanoTime();

    public static class Notif { public String text; public double t; public Color col; public Notif(String s,Color c){text=s;t=3.5;col=c;} }

    public void tick() {
        long n = System.nanoTime();
        dt = Math.min((n - lastNano) / 1e9, .05);
        lastNano = n;
        if (hitPause > 0) { hitPause -= dt; Arrays.fill(just, false); return; }
        update();
        Arrays.fill(just, false);
    }

    void update() {
        switch (state) {
            case TITLE: if (just[KeyEvent.VK_ENTER] || just[VK_SPACE]) state = GameState.SELECT; break;
            case SELECT:
                if (just[VK_LEFT] || just[VK_A]) selChar = (selChar + 4) % 5;
                if (just[VK_RIGHT] || just[VK_D]) selChar = (selChar + 1) % 5;
                if (just[KeyEvent.VK_ENTER] || just[VK_SPACE]) startGame();
                break;
            case PLAY: updatePlay(); break;
            case OVER: if (just[KeyEvent.VK_ENTER] || just[VK_SPACE]) state = GameState.TITLE; break;
        }
    }

    void startGame() {
        state = GameState.PLAY;
        player = new Player(200, (FTOP + FBOT) / 2, selChar);
        enemies.clear(); bosses.clear(); projectiles.clear(); particles.clear(); hitEffects.clear(); notifs.clear();
        defeated = combo = maxCombo = score = 0; spawnCD = 1; wave = 1; bossActive = false;
        Arrays.fill(bossDefeated, false);
        addNotif("WAVE 1 - VAI!", Color.WHITE);
    }

    void updatePlay() {
        player.update(this);
        camera.follow(player.x, dt);
        screenShake.update(dt);

        for (int i = enemies.size()-1; i >= 0; i--) { Enemy en = enemies.get(i); en.update(this); if (en.dead && en.dTimer <= 0) enemies.remove(i); }
        for (int i = bosses.size()-1; i >= 0; i--) { Boss b = bosses.get(i); b.update(this); if (b.dead && b.dTimer <= 0) { bosses.remove(i); bossActive = false; } }
        for (int i = projectiles.size()-1; i >= 0; i--) {
            Projectile p = projectiles.get(i); p.update(dt, stage.stageLen);
            if (!p.dead) { for (Enemy en : enemies) { if (!en.dead && Math.abs(en.x-p.x)<30 && Math.abs(en.y-p.y)<40) { en.hurt(p.dmg, p.face, this, true); spawnHit(en.x,en.y,true); p.dead=true; break; } } }
            if (!p.dead) { for (Boss b : bosses) { if (!b.dead && Math.abs(b.x-p.x)<b.hw+20 && Math.abs(b.y-p.y)<50) { b.hurt(p.dmg, p.face, this); spawnHit(b.x,b.y,true); p.dead=true; break; } } }
            if (p.dead) projectiles.remove(i);
        }

        if (!bossActive) {
            spawnCD -= dt;
            if (spawnCD <= 0) { spawnWave(); spawnCD = Math.max(1, 3 - wave * .15); }
            for (int i = 0; i < 5; i++) { if (wave >= Boss.WAVES[i] && !bossDefeated[i]) { spawnBoss(i); break; } }
        }

        if (combo > 0) { comboTime -= dt; if (comboTime <= 0) combo = 0; }
        hitEffects.removeIf(f -> { f.tick(dt); return f.isDone(); });
        particles.removeIf(p -> { p.update(dt); return p.isDead(); });
        notifs.removeIf(n -> { n.t -= dt; return n.t <= 0; });
        wave = 1 + defeated / 5;
        if (player.hp <= 0) state = GameState.OVER;
    }

    void spawnWave() {
        Random rng = new Random();
        int cnt = Math.min(1 + (int)wave / 3, 4);
        for (int i = 0; i < cnt; i++) {
            double sx = player.x + (rng.nextBoolean() ? 1 : -1) * (350 + rng.nextInt(300));
            sx = Math.max(40, Math.min(sx, stage.stageLen - 40));
            double sy = FTOP + rng.nextInt(FBOT - FTOP);
            int type = rng.nextInt(Math.min(3, 1 + (int)wave / 3));
            for (int b = 4; b >= 0; b--) { if (bossDefeated[b] && rng.nextDouble() < .12) { type = 3 + b; break; } }
            enemies.add(new Enemy(sx, sy, type));
        }
    }

    void spawnBoss(int idx) {
        bossActive = true;
        double bx = player.x + (player.face > 0 ? 400 : -400);
        bx = Math.max(100, Math.min(bx, stage.stageLen - 100));
        bosses.add(new Boss(bx, (FTOP + FBOT) / 2, idx));
        addNotif("BOSS: " + Boss.NAMES[idx], new Color(255, 50, 50));
        shake(12, .3);
    }

    public void spawnHit(double x, double y, boolean big) {
        hitEffects.add(new HitEffect(x, y, big));
        int cnt = big ? 16 : 8;
        Color c = big ? new Color(100,200,255) : new Color(255,200,50);
        for (int i = 0; i < cnt; i++)
            particles.add(new Particle(x, y, (Math.random()-.5)*(big?320:200), (Math.random()-1)*(big?220:160), c, .25+Math.random()*.25));
        shake(big?8:3, big?.15:.06);
    }

    public void shake(double amt, double dur) { screenShake.trigger(amt, dur); }
    public void addNotif(String text, Color col) { notifs.add(new Notif(text, col)); }

    public void render(Graphics2D g) {
        switch (state) {
            case TITLE: menu.render(g); break;
            case SELECT: charSelect.render(g, selChar); break;
            case PLAY: renderPlay(g); break;
            case OVER: renderOver(g); break;
        }
    }

    void renderPlay(Graphics2D g) {
        stage.render(g, camera.x);
        g.translate(-camera.x + screenShake.offX, screenShake.offY);

        // Sort all entities by Y for depth
        List<double[]> order = new ArrayList<>();
        order.add(new double[]{0, player.y, 0});
        for (int i = 0; i < enemies.size(); i++) order.add(new double[]{1, enemies.get(i).y, i});
        for (int i = 0; i < bosses.size(); i++) order.add(new double[]{2, bosses.get(i).y, i});
        order.sort((a, b) -> Double.compare(a[1], b[1]));

        for (double[] d : order) {
            if (d[0] == 0) player.render(g);
            else if (d[0] == 1) enemies.get((int)d[2]).render(g);
            else bosses.get((int)d[2]).render(g);
        }
        for (Projectile p : projectiles) p.render(g);
        for (HitEffect fx : hitEffects) fx.render(g);
        for (Particle p : particles) p.render(g);

        g.translate(camera.x - screenShake.offX, -screenShake.offY);
        hud.render(g, this);
    }

    void renderOver(Graphics2D g) {
        stage.render(g, camera.x);
        g.setColor(new Color(0,0,0,190)); g.fillRect(0,0,W,H);
        g.setFont(new Font("Impact",Font.BOLD,68)); g.setColor(new Color(190,25,25)); g.drawString("GAME OVER",W/2-190,H/2-60);
        g.setFont(new Font("Arial",Font.BOLD,20)); g.setColor(new Color(200,200,200));
        g.drawString(Player.NAMES[player.ctype]+" | Score: "+score, W/2-100, H/2);
        g.drawString("Eliminados: "+defeated+" | Combo Max: "+maxCombo+"x", W/2-150, H/2+35);
        boolean any = false; int dbx = W/2 - 120;
        g.setFont(new Font("Arial",Font.PLAIN,16)); g.setColor(new Color(160,160,160)); g.drawString("Bosses:",dbx,H/2+75);
        for (int i = 0; i < 5; i++) { if (bossDefeated[i]) { g.setColor(Boss.BC1[i]); g.drawString(Boss.NAMES[i],dbx,H/2+100); dbx+=80; any=true; } }
        if (!any) { g.setColor(new Color(100,100,100)); g.drawString("Nenhum",dbx,H/2+100); }
        if ((System.currentTimeMillis()/500)%2==0) { g.setFont(new Font("Arial",Font.BOLD,20)); g.setColor(new Color(255,200,50)); g.drawString("ENTER para voltar",W/2-100,H-40); }
    }

    public void keyPressed(KeyEvent e) { int c=e.getKeyCode(); if(c>=0&&c<512){if(!held[c])just[c]=true;held[c]=true;} }
    public void keyReleased(KeyEvent e) { int c=e.getKeyCode(); if(c>=0&&c<512)held[c]=false; }
}