import os
import numpy as np
import cv2

import gradio as gr

import modules.scripts as scripts
from modules import script_callbacks

from basicsr.utils.download_util import load_file_from_url

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
        with gr.Row():
          add = gr.Button(value="Add", variant="primary")
          # delete = gr.Button(value="Delete")
        with gr.Row():
          reset_btn = gr.Button(value="Reset")
          bg_input = gr.Button(value="Add Background image")
        with gr.Row():
          with gr.Column(scale=3):
            dataset = gr.Examples(examples=os.path.join(scripts.basedir(), "maps"), inputs=[png_input_area],examples_per_page=24,label="Depth Maps")
          with gr.Column(scale=1):
            png_input_area.render()

      with gr.Column():
        # gradioooooo...
        canvas = gr.HTML('<canvas id="depth_lib_canvas" width="512" height="512" style="margin: 0.25rem; border-radius: 0.25rem; border: 0.5px solid"></canvas>')
        jsonbox = gr.Text(label="json", elem_id="hide_json")
        with gr.Row():
          png_output = gr.Button(value="Save PNG")
          send_output = gr.Button(value="Send to ControlNet")


    width.change(None, [width, height], None, _js="(w, h) => {depth_resizeCanvas(w, h)}")
    height.change(None, [width, height], None, _js="(w, h) => {depth_resizeCanvas(w, h)}")
    png_output.click(None, [], None, _js="depth_savePNG")
    bg_input.click(None, [], None, _js="depth_addBackground")
    add.click(None, [png_input_area], None, _js="(path) => {depth_addImg(path)}")
    send_output.click(None, [], None, _js="depth_sendImage")
    reset_btn.click(None, [], None, _js="depth_resetCanvas")

  return [(depth_lib, "Depth Library", "depth_lib")]

script_callbacks.on_ui_tabs(on_ui_tabs)
