let plugInHelper

const defaultConfig = {
  'URLS': 'https://d3js.org/d3.v4.min.js',
  'HTML': '<style>\n</style>\n<div id="ChartHtml">\n    <div id="chart1" style="width:800px; height:600px;background-color: white;">\n        <svg id="chartSVG" style="width:800px; height:600px;background-color: white;"></svg>\n    </div>\n    <script>\n        const svg = d3.select("#chartSVG")\n        const margin = 30\n        const width = 800\n        const height = 600\n\n        const data = alteryxData()\n        const color = d3.scaleOrdinal(d3.schemeCategory20)\n        const x = d3.scaleLinear().domain([0, d3.max(data.map(d => d.x))]).range([0, width - 2 * margin])\n        const y = d3.scaleLinear().domain([0, d3.max(data.map(d => d.y))]).range([height - 2 * margin, 0])\n\n        const chart = svg\n            .attr("width", width)\n            .attr("height", height)\n            .append("g")\n            .attr("transform", `translate(${margin},${margin})`)\n\n        chart\n            .selectAll("rect")\n            .data(data)\n            .enter().append("rect")\n            .attr("fill", d => color(d.x))\n            .attr("width", 19)\n            .attr("height", (d) => (height - y(d.y) - 2 * margin))\n            .attr("x", (d) =>  x(d.x))\n            .attr("y", (d) => y(d.y))\n\n        chart.append("g").attr("transform", `translate(0,${height - 2 * margin})`).call(d3.axisBottom(x))\n        chart.append("g").call(d3.axisLeft(y));\n    </script>\n</div>\n',
  'SaveFile': false,
  'FileName': 'output.html'
}

const editor = CodeMirror.fromTextArea(document.getElementById('html'), {
  lineNumbers: true,
  mode: 'htmlmixed',
  selectionPointer: true
})

const previewError = document.getElementById('previewError')
const previewHTML = document.getElementById('previewHTML')

window.buttonClicked = () => {
  previewError.style.visibility = 'visible'
  previewError.innerText = 'Fetching Data ...'
  previewHTML.innerHTML = ''

  const dataBack = (data, error) => {
    if (error) {
      previewError.innerText = `Error Fetching Data: ${error.errorMsg}`
      return
    }

    previewError.style.visibility = 'hidden'
    previewHTML.innerHTML = '<iframe src="javascript:void(0);" width="100%" height="800px"></iframe>'

    const iframe = previewHTML.firstElementChild
    iframe.contentWindow.console.log = console.log
    iframe.contentWindow.document.open()
    iframe.contentWindow.document.write(`<html><head>${Alteryx.Gui.Manager.getDataItem('URLS').getValue().replace(/\r/g,'').split('\n').map(u => `<script src="${u}"></script>`).join('\n')}</head><script>function alteryxData() { return ${JSON.stringify(data)}; } </script><body>${Alteryx.Gui.Manager.getDataItem('HTML').getValue()}</body></html>`)
    iframe.contentWindow.document.close()
  }
  plugInHelper.getInputDataArray('', 1000, dataBack)
}

Alteryx.Gui.BeforeLoad = function (manager, AlteryxDataItems, json) {
  plugInHelper = PlugInHelper.Create(Alteryx, manager, AlteryxDataItems, window)

  Object.keys(defaultConfig).forEach(k => {
    if (json && json.Configuration && json.Configuration.Value && json.Configuration.Value.filter(v => v["@name"] === k)) {
      const config = json.Configuration.Value.filter(v => v['@name'] === k)[0]
      const type = typeof defaultConfig[k]
      defaultConfig[k] = config['#text'] || config['#cdata-section']
      if (type === 'boolean') defaultConfig[k] = defaultConfig[k] === 'True'
      if (type === 'number') defaultConfig[k] = +defaultConfig[k]
    }

    const item = plugInHelper.createDataItem(k, defaultConfig[k])
    if (k !== 'HTML') manager.bindDataItemToWidget(item, k)
  })
}

Alteryx.Gui.AfterLoad = function (manager, AlteryxDataItems) {
  Object.keys(defaultConfig).forEach(k => {
    const dataItem = manager.getDataItem(k)
    dataItem.setValue(defaultConfig[k])
  })

  const fileItem = manager.getDataItem('SaveFile')
  document.getElementById('OutputFileName').style.visibility = fileItem.getValue() ? 'visible' : 'hidden'
  fileItem.registerPropertyListener('value', () => { document.getElementById('OutputFileName').style.visibility = fileItem.getValue() ? 'visible' : 'hidden' })

  const htmlItem = manager.getDataItem('HTML')
  editor.doc.setValue(htmlItem.getValue())
  editor.on('change', () => htmlItem.setValue(editor.doc.getValue()))
}

Alteryx.Gui.BeforeGetConfiguration = function (json) {
  console.log('BeforeGetConfig called')
  console.log(json)
  return json
}
