let signCanvas = document.getElementById("signcanvas");
let signInput = document.getElementById("sign");
let ctx = signCanvas.getContext("2d");
ctx.strokeStyle = "blue";
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.lineWidth = 2;
let dataURL = "";
let mouseX = 0,
	mouseY = 0;

signCanvas.addEventListener(
	"mousemove",
	function(e) {
		e.stopPropagation();
		mouseX = e.pageX - this.offsetLeft;
		mouseY = e.pageY - this.offsetTop;
	},
	false
);

signCanvas.addEventListener(
	"mousedown",
	function(e) {
		ctx.beginPath();
		ctx.moveTo(mouseX, mouseY);
		signCanvas.addEventListener("mousemove", drawSign, false);
	},
	false
);

signCanvas.addEventListener(
	"mouseup",
	function(e) {
		signCanvas.removeEventListener("mousemove", drawSign, false);
	},
	false
);

function drawSign() {
	ctx.lineTo(mouseX, mouseY);
	ctx.stroke();
	dataURL = signCanvas.toDataURL();
	signInput.value = dataURL;
}
