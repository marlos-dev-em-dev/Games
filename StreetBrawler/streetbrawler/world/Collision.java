package streetbrawler.world;

public class Collision {
    public static boolean inRange(double ax, double ay, double bx, double by, double rangeX, double rangeY) {
        return Math.abs(ax - bx) < rangeX && Math.abs(ay - by) < rangeY;
    }

    public static boolean inCircle(double ax, double ay, double bx, double by, double radius) {
        double dx = ax - bx, dy = ay - by;
        return dx * dx + dy * dy < radius * radius;
    }
}