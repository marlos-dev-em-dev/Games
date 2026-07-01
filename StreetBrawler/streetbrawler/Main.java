package streetbrawler;

import javax.swing.*;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame f = new JFrame("Street Brawler");
            f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            f.setResizable(false);
            f.add(new GamePanel());
            f.pack();
            f.setLocationRelativeTo(null);
            f.setVisible(true);
        });
    }
}