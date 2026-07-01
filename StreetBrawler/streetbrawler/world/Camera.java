package streetbrawler.world;
import static streetbrawler.utils.MathUtils.*;

public class Camera {
    public double x = 0;
    private double stageLen;

    public Camera(double stageLen) { this.stageLen = stageLen; }

    public void follow(double targetX, double dt) {
        double goal = targetX - W * 0.35;
        x += (goal - x) * 0.07 * (dt * 60);
        x = clamp(x, 0, stageLen - W);
    }
}