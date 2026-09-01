extends CharacterBody2D


const SPEED = 100.0
const JUMP_VELOCITY = -300.0
var double_jump = true
var antes = []

var animations = {
	"idle": "idle",
	"run": "run",
	"jump": "jump",
	"double_jump": "double jump",
	"wall": "wall jump",
	"take": "take damage"
}

func animar(nome):
	if $AnimatedSprite2D.animation != animations[nome]:
		$AnimatedSprite2D.play(animations[nome])

func _physics_process(delta: float) -> void:
	
	
	if not is_on_floor():
		velocity += get_gravity() * delta
		
	if is_on_floor():
		animar("run")
		

	# Açoe no chao
	
	# acoe no ar
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	#print($AnimatedSprite2D.animation)
	#if not is_on_floor():
		#velocity += get_gravity() * delta
#
	#if Input.is_action_just_pressed("jump") and is_on_floor():
		#$AnimatedSprite2D.play("take damage")
		#velocity.y = JUMP_VELOCITY
	#elif Input.is_action_just_pressed("jump") and double_jump == true:
		#double_jump = false
		#$AnimatedSprite2D.play("double jump")
		#velocity.y = JUMP_VELOCITY
#
	#var direction := Input.get_axis("left", "right")
	#if direction:
		#if is_on_floor():
			#$AnimatedSprite2D.play("run")
		#velocity.x = direction * SPEED
		#if direction > 0:
			#$AnimatedSprite2D.flip_h = false
			#
		#else: 
			#$AnimatedSprite2D.flip_h = true
		#
	#else:
		#if is_on_floor():
			#$AnimatedSprite2D.play("idle")
		#velocity.x = move_toward(velocity.x, 0, SPEED)


	move_and_slide()
