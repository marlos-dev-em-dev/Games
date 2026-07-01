package streetbrawler.utils;

public class MathUtils {
    public static final int FTOP = 245, FBOT = 445, W = 960, H = 540;

    public static double depthScale(int y) {
        return 0.72 + 0.43 * ((double)(y - FTOP) / (FBOT - FTOP));
    }

    public static double lerp(double a, double b, double t) { return a + (b - a) * t; }
    public static int clamp(int v, int lo, int hi) { return Math.max(lo, Math.min(hi, v)); }
    public static double clamp(double v, double lo, double hi) { return Math.max(lo, Math.min(hi, v)); }
}