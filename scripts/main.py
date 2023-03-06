import os
import numpy as np
import cv2

import gradio as gr

import modules.scripts as scripts
from modules import script_callbacks

from basicsr.utils.download_util import load_file_from_url

maps_path = os.path.join(scripts.basedir(), "maps");
types = list(os.walk(maps_path))[0][1]

class Script(scripts.Script):
  def __init__(self) -> None:
    super().__init__()

  def title(self):
    return "Depth Library"

  def show(self, is_img2img):
    return scripts.AlwaysVisible

  def ui(self, is_img2img):
    return ()

def on_ui_tabs():
  png_input_area = gr.Image(label="Selected")
  with gr.Blocks(analytics_enabled=False) as depth_lib:
    with gr.Row():
      with gr.Column():
        width = gr.Slider(label="width", minimum=64, maximum=2048, value=512, step=64, interactive=True)
        height = gr.Slider(label="height", minimum=64, maximum=2048, value=512, step=64, interactive=True)
        base = gr.Slider(label="Base Depth", minimum=0, maximum=255, value=0, step=1, interactive=True)
        with gr.Row():
          add = gr.Button(value="Add", variant="primary")
          remove = gr.Button(value="Remove selected")
          reset_btn = gr.Button(value="Reset")
        with gr.Row():
          bg_input = gr.Button(value="Add background image")
          bg_remove = gr.Button(value="Remove background image")
        with gr.Row():
          with gr.Column(scale=3):
            for t in types:
              with gr.Tab(t.capitalize()):
                dataset = gr.Examples(examples=os.path.join(maps_path, t), inputs=[png_input_area],examples_per_page=24,label="Depth Maps", elem_id="examples")
          with gr.Column(scale=1):
            png_input_area.render()
            opacity = gr.Slider(label="Opacity", minimum=0.01, maximum=1, value=1, step=0.01, interactive=True)

      with gr.Column():
        # gradioooooo...
        canvas = gr.HTML('<canvas id="depth_lib_canvas" width="512" height="512" style="margin: 0.25rem; border-radius: 0.25rem; border: 0.5px solid"></canvas><style>#examples .gr-sample-image {background-color: #e5e7eb}</style>')
        with gr.Row():
          png_output = gr.Button(value="Save PNG")
          send_output = gr.Button(value="Send to ControlNet")


    width.change(None, [width, height], None, _js="(w, h) => {depth_resizeCanvas(w, h)}")
    height.change(None, [width, height], None, _js="(w, h) => {depth_resizeCanvas(w, h)}")
    base.change(None, [base], None, _js="(base) => {depth_setBrightness(base)}")
    opacity.change(None, [opacity], None, _js="(op) => {depth_setOpacity(op)}")
    png_output.click(None, [], None, _js="depth_savePNG")
    bg_input.click(None, [], None, _js="depth_addBackground")
    bg_remove.click(None, [], None, _js="depth_removeBackground")
    add.click(None, [png_input_area], None, _js="(path) => {depth_addImg(path)}")
    remove.click(None, [], None, _js="depth_removeSelection")
    send_output.click(None, [], None, _js="depth_sendImage")
    reset_btn.click(None, [], None, _js="depth_resetCanvas")

  return [(depth_lib, "Depth Library", "depth_lib")]

script_callbacks.on_ui_tabs(on_ui_tabs)
