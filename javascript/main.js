fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerColor = '#108ce6';
fabric.Object.prototype.borderColor = '#108ce6';
fabric.Object.prototype.cornerSize = 10;
fabric.Object.prototype.lockRotation = false;
fabric.Object.prototype.perPixelTargetFind = true;

let depth_obj = {
    // width, height
    resolution: [512, 512]
}

let depth_executed = false;
let depth_addOpacity = 100;
let depth_bgColor = "#000";

function depth_gradioApp() {
    const elems = document.getElementsByTagName('gradio-app')
    const gradioShadowRoot = elems.length == 0 ? null : elems[0].shadowRoot

    root = !!gradioShadowRoot ? gradioShadowRoot : document;

    let style = document.createElement("style");

    return root;
}

function depth_calcResolution(resolution){
    const width = resolution[0]
    const height = resolution[1]
    const viewportWidth = window.innerWidth / 2.25;
    const viewportHeight = window.innerHeight * 0.75;
    const ratio = Math.min(viewportWidth / width, viewportHeight / height);
    return {width: width * ratio, height: height * ratio}
}

function depth_resizeCanvas(width, height){
    const elem = depth_lib_elem;

    let resolution = depth_calcResolution([width, height])

    depth_lib_canvas.setWidth(width);
    depth_lib_canvas.setHeight(height);
    elem.style.width = resolution["width"] + "px"
    elem.style.height = resolution["height"] + "px"
    elem.nextElementSibling.style.width = resolution["width"] + "px"
    elem.nextElementSibling.style.height = resolution["height"] + "px"
    elem.parentElement.style.width = resolution["width"] + "px"
    elem.parentElement.style.height = resolution["height"] + "px"
}

function depth_addImg(path){
	fabric.Image.fromURL(path, function(oImg) {
		depth_lib_canvas.add(oImg);
		depth_lib_canvas.discardActiveObject();
		depth_lib_canvas.setActiveObject(oImg);
        oImg.set({
            opacity: depth_addOpacity
        });
	});
	depth_lib_canvas.requestRenderAll();
}

function depth_initCanvas(elem){
    window.depth_lib_canvas = new fabric.Canvas(elem, {
        backgroundColor: '#000',
        // selection: false,
        preserveObjectStacking: true
    });

    window.depth_lib_elem = elem

    
    depth_resizeCanvas(...depth_obj.resolution)
}

function depth_resetCanvas(){
    depth_lib_canvas.clear();
    depth_lib_canvas.backgroundColor = depth_bgColor;
}

function depth_savePNG(){
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
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0.5
    depth_lib_canvas.renderAll()
    return
}

function depth_addBackground(){
    const input = document.createElement("input");
    input.type = "file"
    input.accept = "image/*"
    input.addEventListener("change", function(e){
        const file = e.target.files[0];
		var fileReader = new FileReader();
		fileReader.onload = function() {
			var dataUri = this.result;
            depth_lib_canvas.setBackgroundImage(dataUri, depth_lib_canvas.renderAll.bind(depth_lib_canvas), {
                opacity: 0.5
            });
		}
		fileReader.readAsDataURL(file);
    })
    input.click()
}

function depth_removeBackground() {
    depth_lib_canvas.setBackgroundImage(0, depth_lib_canvas.renderAll.bind(depth_lib_canvas));
}

function depth_sendImage(index){
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0
    depth_lib_canvas.discardActiveObject();
    depth_lib_canvas.renderAll()
    depth_lib_elem.toBlob((blob) => {
        const file = new File(([blob]), "pose.png")
        const dt = new DataTransfer();
        dt.items.add(file);
        const list = dt.files
        switch_to_txt2img()
        const selector = "#txt2img_script_container"
        const accordion = gradioApp().querySelector(selector).querySelector("#controlnet .transition");
        if (accordion.classList.contains("rotate-90")) {
            accordion.click()
        }
        const tabs = gradioApp().querySelector(selector).querySelectorAll("#controlnet > div:nth-child(2) > .tabs > .tabitem, #controlnet > div:nth-child(2) > div:not(.tabs)")
        const tab = tabs[index]
        if (tab.classList.contains("tabitem")) {
            tab.parentElement.firstElementChild.querySelector(`:nth-child(${Number(index) + 1})`).click()
        }
        const input = tab.querySelector("input[type='file']")
        try {
            input.previousElementSibling.previousElementSibling.querySelector("button[aria-label='Clear']").click()
        } catch (e) {
            console.error(e)
        }
        input.value = "";
        input.files = list;
        const event = new Event('change', { 'bubbles': true, "composed": true });
        input.dispatchEvent(event);
    });
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0.5
    depth_lib_canvas.renderAll()
}

function depth_setBrightness(br) {
    hex = br.toString(16).padStart(2, "0");
    depth_bgColor = "#" + hex + hex + hex;
    depth_lib_canvas.backgroundColor = depth_bgColor;
    depth_lib_canvas.requestRenderAll();
}

function depth_setOpacity(op) {
    depth_addOpacity = op;
    if (!depth_lib_canvas.getActiveObject()) {
        return;
    }
    for (let i = 0; i < depth_lib_canvas.getActiveObjects().length; i++) {
        const element = depth_lib_canvas.getActiveObjects()[i];
        element.opacity = depth_addOpacity;
    }
    depth_lib_canvas.requestRenderAll();
}

function depth_removeSelection() {
    depth_lib_canvas.remove(...depth_lib_canvas.getActiveObjects());
    depth_lib_canvas.discardActiveObject().renderAll();
}

window.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((m) => {
        if(!depth_executed && depth_gradioApp().querySelector('#depth_lib_canvas')){
            depth_executed = true;
            depth_initCanvas(depth_gradioApp().querySelector('#depth_lib_canvas'))
            // depth_gradioApp().querySelectorAll("#tabs > div > button").forEach((elem) => {
            //     if (elem.innerText === "OpenPose Editor") elem.click()
            // })
            observer.disconnect();
        }
    })
    observer.observe(depth_gradioApp(), { childList: true, subtree: true })
})
