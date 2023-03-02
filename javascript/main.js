fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerColor = '#108ce6';
fabric.Object.prototype.borderColor = '#108ce6';
fabric.Object.prototype.cornerSize = 10;
fabric.Object.prototype.lockRotation = false;

let count = 0;
let executed = false;

let lockMode = false;
const undo_history = [];
function gradioApp() {
    const elems = document.getElementsByTagName('gradio-app')
    const gradioShadowRoot = elems.length == 0 ? null : elems[0].shadowRoot
    return !!gradioShadowRoot ? gradioShadowRoot : document;
}

function calcResolution(resolution){
    const width = resolution[0]
    const height = resolution[1]
    const viewportWidth = window.innerWidth / 2.25;
    const viewportHeight = window.innerHeight * 0.75;
    const ratio = Math.min(viewportWidth / width, viewportHeight / height);
    return {width: width * ratio, height: height * ratio}
}

function resizeCanvas(width, height){
    const elem = depth_lib_elem;
    const canvas = depth_lib_canvas;

    let resolution = calcResolution([width, height])

    canvas.setWidth(width);
    canvas.setHeight(height);
    elem.style.width = resolution["width"] + "px"
    elem.style.height = resolution["height"] + "px"
    elem.nextElementSibling.style.width = resolution["width"] + "px"
    elem.nextElementSibling.style.height = resolution["height"] + "px"
    elem.parentElement.style.width = resolution["width"] + "px"
    elem.parentElement.style.height = resolution["height"] + "px"
}

function addImg(path){
	const canvas = depth_lib_canvas;
	fabric.Image.fromURL(path, function(oImg) {
		canvas.add(oImg);
		canvas.discardActiveObject();
		canvas.setActiveObject(oImg);
	});
	canvas.requestRenderAll();
}

function initCanvas(elem){
    const canvas = window.depth_lib_canvas = new fabric.Canvas(elem, {
        backgroundColor: '#000',
        // selection: false,
        preserveObjectStacking: true
    });

    window.depth_lib_elem = elem

    
    resizeCanvas(...openpose_obj.resolution)
}

function resetCanvas(){
    const canvas = depth_lib_canvas;
    canvas.clear()
    canvas.backgroundColor = "#000"
}

function savePNG(){
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0
    depth_lib_canvas.discardActiveObject();
    depth_lib_canvas.renderAll()
    depth_lib_elem.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "pose.png";
        a.click();
        URL.revokeObjectURL(a.href);
    });
    depth_lib_canvas.getObjects("image").forEach((img) => {
        img.set({
            opacity: 1
        });
    })
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0.5
    depth_lib_canvas.renderAll()
    return
}

function addBackground(){
    const input = document.createElement("input");
    input.type = "file"
    input.accept = "image/*"
    input.addEventListener("change", function(e){
        const canvas = depth_lib_canvas
        const file = e.target.files[0];
		var fileReader = new FileReader();
		fileReader.onload = function() {
			var dataUri = this.result;
            canvas.setBackgroundImage(dataUri, canvas.renderAll.bind(canvas), {
                opacity: 0.5
            });
		}
		fileReader.readAsDataURL(file);
    })
    input.click()
}

function sendImage(){
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0
    depth_lib_canvas.discardActiveObject();
    depth_lib_canvas.renderAll()
    depth_lib_elem.toBlob((blob) => {
        const file = new File(([blob]), "pose.png")
        const dt = new DataTransfer();
        dt.items.add(file);
        const list = dt.files
        gradioApp().querySelector("#txt2img_script_container").querySelectorAll("span.transition").forEach((elem) => {
            if (elem.previousElementSibling.textContent === "ControlNet"){
                switch_to_txt2img()
                elem.className.includes("rotate-90") && elem.parentElement.click();
                const input = elem.parentElement.parentElement.querySelector("input[type='file']");
                const button = elem.parentElement.parentElement.querySelector("button[aria-label='Clear']")
                button && button.click();
                input.value = "";
                input.files = list;
                const event = new Event('change', { 'bubbles': true, "composed": true });
                input.dispatchEvent(event);
            }
        })
    });
    depth_lib_canvas.getObjects("image").forEach((img) => {
        img.set({
            opacity: 1
        });
    })
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0.5
    depth_lib_canvas.renderAll()
}

window.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((m) => {
        if(!executed && gradioApp().querySelector('#depth_lib_canvas')){
            executed = true;
            initCanvas(gradioApp().querySelector('#depth_lib_canvas'))
            // gradioApp().querySelectorAll("#tabs > div > button").forEach((elem) => {
            //     if (elem.innerText === "OpenPose Editor") elem.click()
            // })
            observer.disconnect();
        }
    })
    observer.observe(gradioApp(), { childList: true, subtree: true })
})
