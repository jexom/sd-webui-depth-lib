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

function depth_calcResolution(resolution) {
    const width = resolution[0]
    const height = resolution[1]
    const viewportWidth = window.innerWidth / 2.25;
    const viewportHeight = window.innerHeight * 0.75;
    const ratio = Math.min(viewportWidth / width, viewportHeight / height);
    return { width: width * ratio, height: height * ratio }
}

function depth_resizeCanvas(width, height) {
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

    document.querySelector('#depth_lib_width input[type=range]').value = width;
    document.querySelector('#depth_lib_width input[type=number]').value = width;
    document.querySelector('#depth_lib_height input[type=range]').value = height;
    document.querySelector('#depth_lib_height input[type=number]').value = height;
}

function depth_addImg(path) {
    fabric.Image.fromURL(path, function (oImg) {
        depth_lib_canvas.add(oImg);
        depth_lib_canvas.discardActiveObject();
        depth_lib_canvas.setActiveObject(oImg);
        oImg.set({
            opacity: depth_addOpacity
        });
    });
    depth_lib_canvas.requestRenderAll();
}

function depth_initCanvas(elem) {
    window.depth_lib_canvas = new fabric.Canvas(elem, {
        backgroundColor: '#000',
        // selection: false,
        preserveObjectStacking: true
    });

    window.depth_lib_elem = elem

    depth_lib_canvas.wrapperEl.addEventListener('drop', function (e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.match('image.*')) {
                const fileReader = new FileReader();
                fileReader.onload = function (evt) {
                    const dataUri = evt.target.result;
                    const imgObj = new Image();
                    imgObj.onload = function () {
                        depth_lib_canvas.setBackgroundImage(dataUri, depth_lib_canvas.renderAll.bind(depth_lib_canvas), {
                            opacity: 0.5,
                            width: imgObj.width,
                            height: imgObj.height,
                        });
                        depth_resizeCanvas(imgObj.width, imgObj.height);
                    }
                    imgObj.src = dataUri;
                };
                fileReader.readAsDataURL(file);
            }
        }
    }, false);

    depth_resizeCanvas(...depth_obj.resolution)
}

function depth_resetCanvas() {
    depth_lib_canvas.clear();
    depth_lib_canvas.backgroundColor = depth_bgColor;
}

function depth_savePNG() {
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

function depth_addBackground() {
    const input = document.createElement("input");
    input.type = "file"
    input.accept = "image/*"
    input.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file.type.match('image.*')) {
            const fileReader = new FileReader();
            fileReader.onload = function (evt) {
                const dataUri = evt.target.result;
                const imgObj = new Image();
                imgObj.onload = function () {
                    depth_lib_canvas.setBackgroundImage(dataUri, depth_lib_canvas.renderAll.bind(depth_lib_canvas), {
                        opacity: 0.5,
                        width: imgObj.width,
                        height: imgObj.height,
                    });
                    depth_resizeCanvas(imgObj.width, imgObj.height);
                }
                imgObj.src = dataUri;
            }
            fileReader.readAsDataURL(file);
        }
    })
    input.click()
}

function depth_removeBackground() {
    depth_lib_canvas.setBackgroundImage(0, depth_lib_canvas.renderAll.bind(depth_lib_canvas));
}

function depth_sendImageTxt2Img() {
    depth_sendImage(
        '#txt2img_controlnet',
        switch_to_txt2img,
    );
}

function depth_sendImageImg2Img() {
    depth_sendImage(
        '#img2img_controlnet',
        switch_to_img2img,
    );
}

function depth_sendImage(controlNetDivId, switchFn) {
    if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0;
    depth_lib_canvas.discardActiveObject();
    depth_lib_canvas.renderAll();
    depth_lib_elem.toBlob(async (blob) => {
        const file = new File(([blob]), "pose.png");
        const dt = new DataTransfer();
        dt.items.add(file);
        const list = dt.files;

        const divControlNet = depth_gradioApp().querySelector(controlNetDivId);
        if (divControlNet) {
            switchFn();

            // open the ControlNet accordion if it's not already open
            // but give up if it takes longer than 5 secs
            labelControlNet = divControlNet.querySelector("div.label-wrap");
            if (!labelControlNet.classList.contains("open")) {
                labelControlNet.click();
                let waitUntilHasClassOpenCount = 0;
                const waitUntilHasClassOpen = async () => {
                    waitUntilHasClassOpenCount++;
                    if (labelControlNet.classList.contains("open")) {
                        return true;
                    } else if (waitUntilHasClassOpenCount > 50) {
                        return false;
                    } else {
                        setTimeout(() => waitUntilHasClassOpen(), 100)
                    }
                };
                await waitUntilHasClassOpen();
            }

            const input = divControlNet.querySelector("input[type='file']");
            const button = divControlNet.querySelector("button[aria-label='Clear']")
            button && button.click();
            input.value = "";
            input.files = list;
            const event = new Event('change', { 'bubbles': true, "composed": true });
            input.dispatchEvent(event);
        }

        if (depth_lib_canvas.backgroundImage) depth_lib_canvas.backgroundImage.opacity = 0.5
        depth_lib_canvas.renderAll()
    });
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

function depth_addText() {
    depth_lib_canvas.add(new fabric.IText('Tap and Type', {
        left: 50,
        top: 100,
        fontFamily: 'arial white',
        fill: '#FFF',
        fontSize: 50
    }));
    depth_lib_canvas.requestRenderAll();
}

function depth_setFontFamily(font) {
    depth_lib_canvas.getActiveObject().set("fontFamily", font)
    depth_lib_canvas.requestRenderAll();
}

function depth_setTextAlign(align) {
    depth_lib_canvas.getActiveObject().set('textAlign', align);
    depth_lib_canvas.requestRenderAll();
}

function depth_setTextDecoration(decoration) {
    if (decoration.indexOf("bold") >= 0) {
        depth_lib_canvas.getActiveObject().set("fontWeight", "bold");
    } else {
        depth_lib_canvas.getActiveObject().set("fontWeight", "");
    }

    if (decoration.indexOf('italic') >= 0) {
        depth_lib_canvas.getActiveObject().set("fontStyle", "italic");
    } else {
        depth_lib_canvas.getActiveObject().set("fontStyle", "");
    }
    depth_lib_canvas.requestRenderAll();
}

window.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((m) => {
        if (!depth_executed && depth_gradioApp().querySelector('#depth_lib_canvas')) {
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
