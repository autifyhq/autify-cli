import {AxiosRequestConfig} from 'axios'
import {get, getOrThrow} from '../../config'
import '../../debug'
import FormData from 'form-data'
import {readFileSync} from 'fs';
import { Configuration, InlineResponse201, InlineResponse2011, InlineResponse2011TestPlan, InlineResponse2011TestPlanBuild, InlineResponse400, InlineResponse400Errors, RunTestPlanRequest, BuildsApiAxiosParamCreator, BuildsApiFp, BuildsApiFactory, BuildsApi, TestPlansApiAxiosParamCreator, TestPlansApiFp, TestPlansApiFactory, TestPlansApi } from "./openapi";

class CustomFormData extends FormData {
    append(key: string, filename: any) {
        const blob = readFileSync(filename)
        super.append(key, blob, {filename})
    }
}

export class Client {
    constructor(configDir: string, userAgent: string) {
        const accessToken = getOrThrow(configDir, 'AUTIFY_MOBILE_ACCESS_TOKEN')
        const basePath = get(configDir, 'AUTIFY_MOBILE_BASE_PATH')
        const baseOptions = {
            headers: {
                'User-Agent': userAgent,
            }
        }
        const configuration = new Configuration({accessToken, basePath, formDataCtor: CustomFormData, baseOptions})
        this.buildsApi = new BuildsApi(configuration)
        this.testPlansApi = new TestPlansApi(configuration)
    }

    private readonly buildsApi;

    /**
     * Upload the build file.
     * @summary Upload a build
     * @param {string} projectId The ID of the project to upload the build file to.
     * @param {any} file Build file.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BuildsApi
     */
    uploadBuild(projectId: string, file: any, options?: AxiosRequestConfig) {
        return this.buildsApi.uploadBuild(projectId, file, options)
    }

    private readonly testPlansApi;

    /**
     * Run a test plan
     * @summary Run a test plan
     * @param {string} testPlanId The ID of the test plan to run.
     * @param {RunTestPlanRequest} runTestPlanRequest The build_id to execute the test plan.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TestPlansApi
     */
    runTestPlan(testPlanId: string, runTestPlanRequest: RunTestPlanRequest, options?: AxiosRequestConfig) {
        return this.testPlansApi.runTestPlan(testPlanId, runTestPlanRequest, options)
    }
}