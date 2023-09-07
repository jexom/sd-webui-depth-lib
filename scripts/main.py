import os

import gradio as gr

import modules.scripts as scripts
from modules import script_callbacks

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
  png_input_area = gr.Image(label="Selected", elem_id="depth_lib_png_input_area")

  with gr.Blocks(analytics_enabled=False) as depth_lib:
    with gr.Row():
      with gr.Column():
        with gr.Accordion("Canvas"):
          with gr.Row():
            width = gr.Slider(label="Width", elem_id="depth_lib_width", minimum=64, maximum=2048, value=512, step=64, interactive=True)
            height = gr.Slider(label="Height", elem_id="depth_lib_height", minimum=64, maximum=2048, value=512, step=64, interactive=True)
            base = gr.Slider(label="Base Depth", minimum=0, maximum=255, value=0, step=1, interactive=True)
          with gr.Row():
            bg_input = gr.Button(value="Add Background Image")
            bg_remove = gr.Button(value="Remove Background Image")
        with gr.Tab("Maps"):
          for t in types:
            with gr.Tab(t.capitalize()):
              dataset = gr.Examples(examples=os.path.join(maps_path, t), inputs=[png_input_area], examples_per_page=24, label=None, elem_id="depth_lib_examples")
          with gr.Row():
            add_map = gr.Button(value="Add", variant="primary")
            remove_map = gr.Button(value="Remove Selected")
            opacity_map = gr.Slider(label="Opacity", minimum=0.01, maximum=1, value=1, step=0.01, interactive=True)
          with gr.Row():
            png_input_area.render()
        with gr.Tab("Text"):
          with gr.Row():
            font_family = gr.Dropdown(label='Font Family', value="arial", choices=["arial", "comic sans ms", "consolas", "courier new", "georgia", "helvetica", "impact", "myriad pro", "verdana", "webdings", "wingdings"], elem_id="depth_lib_fontFamily")
          with gr.Row():
            text_align = gr.Dropdown(label='Text Alignment', value="left", choices=["left", "center", "right", "justify"], elem_id="depth_lib_textAlign")
            text_decoration = gr.CheckboxGroup(label="Text Decoration", value=[], choices=["bold", "italic"], elem_id="depth_lib_textDecoration")
          with gr.Row():
            add_text = gr.Button(value="Add", variant="primary")
            remove_text = gr.Button(value="Remove Selected")
            opacity_text = gr.Slider(label="Opacity", minimum=0.01, maximum=1, value=1, step=0.01, interactive=True)

      with gr.Column():
        canvas = gr.HTML('<canvas id="depth_lib_canvas" width="512" height="512" style="margin: 0.25rem; border-radius: 0.25rem; border: 0.5px solid"></canvas><style>#depth_lib_examples img.gallery {background-color: #e5e7eb}</style>')
        with gr.Row():
          reset_btn = gr.Button(value="Reset")
          png_output = gr.Button(value="Save PNG")
          send_output_txt2img = gr.Button(value="Send to Txt2Img")
          send_output_img2img = gr.Button(value="Send to Img2Img")

    width.change(None, [width, height], None, _js="(w, h) => {depth_resizeCanvas(w, h)}")
    height.change(None, [width, height], None, _js="(w, h) => {depth_resizeCanvas(w, h)}")
    base.change(None, [base], None, _js="(base) => {depth_setBrightness(base)}")
    bg_input.click(None, [], None, _js="depth_addBackground")
    bg_remove.click(None, [], None, _js="depth_removeBackground")

    add_map.click(None, [png_input_area], None, _js="(path) => {depth_addImg(path)}")
    add_text.click(None, [], None, _js="depth_addText")
    remove_map.click(None, [], None, _js="depth_removeSelection")
    remove_text.click(None, [], None, _js="depth_removeSelection")
    opacity_map.change(None, [opacity_map], None, _js="(op) => {depth_setOpacity(op)}")
    opacity_text.change(None, [opacity_text], None, _js="(op) => {depth_setOpacity(op)}")

    font_family.change(None, [font_family], None, _js="(fontFamily) => {depth_setFontFamily(fontFamily)}")
    text_align.change(None, [text_align], None, _js="(textAlign) => {depth_setTextAlign(textAlign)}")
    text_decoration.change(None, [text_decoration], None, _js="(textDecoration) => {depth_setTextDecoration(textDecoration)}")

    reset_btn.click(None, [], None, _js="depth_resetCanvas")
    png_output.click(None, [], None, _js="depth_savePNG")
    send_output_txt2img.click(None, [], None, _js="() => depth_sendImageTxt2Img()")
    send_output_img2img.click(None, [], None, _js="() => depth_sendImageImg2Img()")

  return [(depth_lib, "Depth Library", "depth_lib")]

script_callbacks.on_ui_tabs(on_ui_tabs)
