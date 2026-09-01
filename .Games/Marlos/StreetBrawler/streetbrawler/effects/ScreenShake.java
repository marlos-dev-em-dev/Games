package streetbrawler.effects;

public class ScreenShake {
    private double amount, timer;
    public double offX, offY;

    public void trigger(double amt, double dur) { amount = amt; timer = dur; }

    public void update(double dt) {
        if (timer > 0) {
            timer -= dt;
            offX = (Math.random() - .5) * amount * 2;
            offY = (Math.random() - .5) * amount * 2;
        } else { offX = offY = 0; }
    }
}