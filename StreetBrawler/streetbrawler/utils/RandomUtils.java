package streetbrawler.utils;
import java.util.Random;

public class RandomUtils {
    private static final Random R = new Random();
    public static double range(double a, double b) { return a + R.nextDouble() * (b - a); }
    public static int rangeInt(int a, int b) { return a + R.nextInt(Math.max(1, b - a)); }
    public static boolean chance(double p) { return R.nextDouble() < p; }
    public static Random rng() { return R; }
}