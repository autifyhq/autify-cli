import debug from 'debug'
import axios from 'axios'
import {requestLogger, responseLogger, errorLogger, setGlobalConfig} from 'axios-logger'

setGlobalConfig({
  logger: debug('axios'),
})
axios.interceptors.request.use(requestLogger, errorLogger)
axios.interceptors.response.use(responseLogger, errorLogger)
