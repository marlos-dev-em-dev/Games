package streetbrawler;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import static streetbrawler.utils.MathUtils.*;

public class GamePanel extends JPanel implements ActionListener, KeyListener {
    private Game game;
    private javax.swing.Timer timer;

    public GamePanel() {
        setPreferredSize(new Dimension(W, H));
        setBackground(Color.BLACK);
        setFocusable(true);
        addKeyListener(this);
        game = new Game();
        timer = new javax.swing.Timer(16, this);
        timer.start();
    }

    public void actionPerformed(ActionEvent e) {
        game.tick();
        repaint();
    }

    protected void paintComponent(Graphics gg) {
        super.paintComponent(gg);
        Graphics2D g = (Graphics2D) gg;
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        game.render(g);
    }

    public void keyPressed(KeyEvent e) { game.keyPressed(e); }
    public void keyReleased(KeyEvent e) { game.keyReleased(e); }
    public void keyTyped(KeyEvent e) {}
}