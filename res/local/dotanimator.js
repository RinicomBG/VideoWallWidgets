function DotAnimator(canvas) {
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.colors = ["red", "green", "blue"];
	this.colorIndex = 0;
	this.visible = true;
	this.lastToggleTime = performance.now();
	this.x = 50;
	this.y = 50;

	this.draw = function() {
		this.ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (this.visible) {
			this.ctx.beginPath();
			this.ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
			this.ctx.fillStyle = this.colors[this.colorIndex];
			this.ctx.fill();
		}
	};

	this.update = () => {
		let now = performance.now();
		if (now - this.lastToggleTime >= 500) {
			this.visible = !this.visible;
			if (this.visible) {
				this.colorIndex = (this.colorIndex + 1) % this.colors.length;
			}
			this.lastToggleTime = now;
		}
		this.draw();
		requestAnimationFrame(this.update);
	};

	this.start = function() {
		requestAnimationFrame(this.update);
	};

	this.onResize = function(parentElement) {
		const containerRect = parentElement.getBoundingClientRect();
		this.canvas.width = containerRect.width;
		this.canvas.height = containerRect.height;
		this.x = containerRect.width / 2;
		this.y = containerRect.height / 2;
		console.log('width: ', this.canvas.width, ' height: ', this.canvas.width);
	};
}
