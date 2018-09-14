window.PlugInHelper = (() => {
  return {
    Create: (alteryx, manager, AlteryxDataItems, window) => {
      const jsEvent = (obj) => alteryx.JsEvent(JSON.stringify(obj))
      const openHelpPage = (url) => jsEvent({
        Event: 'OpenHelpPage',
        url
      })

      let callbackId = 0

      const makeCallback = (callback) => {
        const callbackName = `callback${callbackId++}`

        window[callbackName] = (o) => {
          delete window[callbackName]
          callback(o)
        }

        return callbackName
      }

      // Read Input Data
      const getInputData = (connection, rows, callback) => {
        jsEvent({
          Event: 'GetInputData',
          callback: makeCallback(callback),
          anchorIndex: 0,
          connectionName: connection,
          numRecs: rows,
          offset: 0
        })
      }

      const getInputDataArray = (connection, rows, callback) => {
        const newCallback = (o) => {
          if (o.errorMsg) {
            callback(null, o)
            return
          }
          const newObj = o.data ? o.data.map((d) => {
            const output = {}
            d.forEach((v, i) => {
              output[o.fields[i].strName] = v
            })
            return output
          }) : {}
          callback(newObj)
        }
        getInputData(connection, rows, newCallback)
      }

      const createDataItem = (dataName, value, suppressed = false) => {
        let output
        switch (typeof (value)) {
          case 'boolean':
            output = new AlteryxDataItems.SimpleBool(dataName)
            break
          case 'string':
            if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
              output = new AlteryxDataItems.SimpleDate(dataName, {
                dateFormat: 'YYYY-MM-DD'
              })
            } else if (value.match(/^\d{2}:\d{2}:\d{2}$/)) {
              output = new AlteryxDataItems.SimpleTime(dataName, {
                timeFormat: 'HH:mm:ss'
              })
            } else if (value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
              output = new AlteryxDataItems.SimpleDateTime(dataName, {
                dateFormat: 'YYYY-MM-DD',
                timeFormat: 'HH:mm:ss'
              })
            } else {
              output = new AlteryxDataItems.SimpleString(dataName)
            }
            break
          case 'number':
            output = value % 1 ? new AlteryxDataItems.SimpleFloat(dataName) : new AlteryxDataItems.SimpleInt(dataName)
            break
        }

        output.setSuppressed(suppressed)
        manager.addDataItem(output)
        output.setValue(value)
        return output
      }

      return {
        openHelpPage,
        getInputDataArray,
        truncateString: (input, length = 30) => (input.length > length ? `${input.substring(0, 27)}...` : input),
        createDataItem
      }
    }
  }
})()
