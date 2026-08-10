extends CharacterBody2D


const SPEED = 100.0
const JUMP_VELOCITY = -300.0
var antes = []

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		pass
		velocity += get_gravity() * delta

	if Input.is_action_just_pressed("jump") and is_on_floor():
		$AnimatedSprite2D.play("double jump")
		velocity.y = JUMP_VELOCITY

	var direction := Input.get_axis("left", "right")
	if direction:
		$AnimatedSprite2D.play("run")
		velocity.x = direction * SPEED
		if direction > 0:
			$AnimatedSprite2D.flip_h = false
			
		else: 
			$AnimatedSprite2D.flip_h = true
		
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)


	move_and_slide()
