import * as core from '@actions/core'
import FormData from 'form-data'
import {createReadStream} from 'fs'
import axios from 'axios'
import {OptionalFormData} from './optionalformdata'

const apiVersion = 'v1'

const inputs: InputData = getInputs()

/**
 * The data that is passed to the action. Exported to allow for easy testing.
 */
export function getInputs(): InputData {
  return {
    apiHost: core.getInput('apiHost'),
    apiToken: core.getInput('apiToken'),
    publicKey: core.getInput('publicKey'),
    platform: core.getInput('platform'),
    appFile: core.getInput('appFile'),
    appUrl: core.getInput('appUrl'),
    fileType: core.getInput('fileType'),
    note: core.getInput('note'),
    timeout: Number(core.getInput('timeout')),
    disabled: Boolean(core.getInput('disabled')),
    disableHome: Boolean(core.getInput('disableHome')),
    useLastFrame: Boolean(core.getInput('useLastFrame')),
    buttonText: core.getInput('buttonText'),
    postSessionButtonText: core.getInput('postSessionButtonText'),
    launchUrl: core.getInput('launchUrl')
  }
}

/**
 * Uploads a build to Appetize.
 * If a [publicKey] is specified, an existing app will be updated, otherwise a new app will be created.
 * @returns The public key of the uploaded build.
 * @throws An error if neither [appFile] nor [appUrl] are specified.
 */
export const uploadBuild = async (): Promise<OutputData> => {
  validateInputData(inputs)
  const [data, headers] = dataAndHeaders()
  core.info(`Uploading build to ${url()}`)
  core.info('Attached scrubbed build info:')
  const scrubbedInputs = {...inputs}
  scrubbedInputs.apiToken = "scrubbed"
  core.info(`${JSON.stringify(scrubbedInputs)}`)
  const response = await axios.post(url(), data, {
    auth: {
      username: inputs.apiToken,
      password: ''
    },
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })
  return response.data
}

/**
 * Retrieves the data and headers for the given inputs.
 * @returns The data and headers for the request.
 * @throws An error if neither [appFile] nor [appUrl] are specified.
 */
const dataAndHeaders = (): [
  data: FormData | UrlData,
  headers: FormData.Headers | undefined
] => {
  if (inputs.appFile) {
    const data = fileData()
    return [data, data.getHeaders()]
  } else if (inputs.appUrl) {
    return [urlData(), undefined]
  } else {
    throw new Error('Either appFile or appUrl must be specified')
  }
}

/**
 * Validates that all inputs are valid.
 * @throws An error if any input is invalid with the reason.
 */
const validateInputData = (input: InputData): void => {
  //Platform valid types
  if (input.platform !== 'ios' && input.platform !== 'android') {
    throw new Error('Platform must be either ios or android')
  }
  //AppFile or AppUrl required
  if (!input.appFile && !input.appUrl) {
    throw new Error('Either appFile or appUrl must be specified')
  }
  //FileType valid types
  if (
    input.fileType &&
    input.fileType !== 'apk' &&
    input.fileType !== 'zip' &&
    input.fileType !== 'tar.gz'
  ) {
    throw new Error('FileType must be either apk, zip, or tar.gz')
  }
  //Timeout must be a valid number
  if (
    input.timeout &&
    input.timeout !== 30 &&
    input.timeout !== 60 &&
    input.timeout !== 120 &&
    input.timeout !== 180 &&
    input.timeout !== 300 &&
    input.timeout !== 600 &&
    input.timeout !== 1800 &&
    input.timeout !== 3600 &&
    input.timeout !== 7200
  ) {
    throw new Error(
      'Timeout must be either 30, 60, 120, 180, 300, 600, 1800, 3600, or 7200'
    )
  }
}

/**
 * Creates the URL for the request.
 */
const url = (): string => {
  const baseUrl = `${inputs.apiHost}/${apiVersion}/apps/`
  if (inputs.publicKey) {
    return baseUrl + inputs.publicKey
  }
  return baseUrl
}

/**
 * Creates a FormData object for uploading a local file.
 */
const fileData = (): FormData => {
  const form = new OptionalFormData()
  form.append('file', createReadStream(inputs.appFile))
  form.append('platform', inputs.platform)
  form.appendOptional('fileType', inputs.fileType)
  form.appendOptional('note', inputs.note)
  form.appendOptional('timeout', String(inputs.timeout))
  form.appendOptional('disabled', String(inputs.disabled))
  form.appendOptional('disableHome', String(inputs.disableHome))
  form.appendOptional('useLastFrame', String(inputs.useLastFrame))
  form.appendOptional('buttonText', inputs.buttonText)
  form.appendOptional('postSessionButtonText', inputs.postSessionButtonText)
  form.appendOptional('launchUrl', inputs.launchUrl)
  return form
}

/**
 * Creates a UrlData object for uploading a remote file.
 */
const urlData = (): UrlData => {
  return {
    url: inputs.appUrl,
    platform: inputs.platform,
    fileType: inputs.fileType,
    note: inputs.note,
    timeout: inputs.timeout,
    disabled: inputs.disabled,
    disableHome: inputs.disableHome,
    useLastFrame: inputs.useLastFrame,
    buttonText: inputs.buttonText,
    postSessionButtonText: inputs.postSessionButtonText,
    launchUrl: inputs.launchUrl
  }
}

interface UrlData {
  url: string
  platform: string
  fileType: string
  note: string
  timeout: number
  disabled: boolean
  disableHome: boolean
  useLastFrame: boolean
  buttonText: string
  postSessionButtonText: string
  launchUrl: string
}

interface InputData {
  apiHost: string
  apiToken: string
  publicKey: string
  platform: string
  appFile: string
  appUrl: string
  fileType: string
  note: string
  timeout: number
  disabled: boolean
  disableHome: boolean
  useLastFrame: boolean
  buttonText: string
  postSessionButtonText: string
  launchUrl: string
}

interface OutputData {
  publicKey: string
}
