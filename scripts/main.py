import os
import numpy as np
import cv2

import gradio as gr

import modules.scripts as scripts
from modules import script_callbacks

from basicsr.utils.download_util import load_file_from_url

body_estimation = None

def pil2cv(in_image):
  out_image = np.array(in_image, dtype=np.uint8)

  if out_image.shape[2] == 3:
      out_image = cv2.cvtColor(out_image, cv2.COLOR_RGB2BGR)
  return out_image

def candidate2li(li):
  res = []
  for x, y, *_ in li:
    res.append([x, y])
  return res

def subset2li(li):
  res = []
  for r in li:
    for c in r:
      res.append(c)
  return res

class Script(scripts.Script):
  def __init__(self) -> None:
    super().__init__()

  def title(self):
    return "Hand Poser"

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
          dataset = gr.Examples(examples=os.path.abspath(os.path.join(os.path.dirname(__file__), "../maps")), inputs=[png_input_area],examples_per_page=24,label="Depth Maps")
          png_input_area.render()

      with gr.Column():
        # gradioooooo...
        canvas = gr.HTML('<canvas id="depth_lib_canvas" width="512" height="512" style="margin: 0.25rem; border-radius: 0.25rem; border: 0.5px solid"></canvas>')
        jsonbox = gr.Text(label="json", elem_id="hide_json")
        with gr.Row():
          png_output = gr.Button(value="Save PNG")
          send_output = gr.Button(value="Send to ControlNet")


    width.change(None, [width, height], None, _js="(w, h) => {resizeCanvas(w, h)}")
    height.change(None, [width, height], None, _js="(w, h) => {resizeCanvas(w, h)}")
    png_output.click(None, [], None, _js="savePNG")
    bg_input.click(None, [], None, _js="addBackground")
    add.click(None, [png_input_area], None, _js="(path) => {addImg(path)}")
    send_output.click(None, [], None, _js="sendImage")
    reset_btn.click(None, [], None, _js="resetCanvas")

  return [(depth_lib, "Depth Library", "depth_lib")]

script_callbacks.on_ui_tabs(on_ui_tabs)