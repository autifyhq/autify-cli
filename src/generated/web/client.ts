import {AxiosRequestConfig} from 'axios'
import {get, getOrThrow} from '../../config'
import '../../debug'
import FormData from 'form-data'
import {readFileSync} from 'fs';
import { Configuration, Capability, CapabilityOption, CreateUrlReplacementRequest, ExecuteScenariosRequest, ExecuteScenariosRequestExecutionTypeEnum, ExecuteScenariosRequestCapabilities, ExecuteScenariosRequestScenarios, ExecuteScenariosResult, InlineResponse200, InlineResponse2001, InlineResponse2001StatusEnum, InlineResponse2001TestPlan, InlineResponse2001TestPlanCapabilityResults, InlineResponse200Data, InlineResponse200DataAttributes, InlineResponse401, InlineResponse4011, InlineResponse4011Errors, InlineResponse401Errors, InlineResponse404, InlineResponse4041, InlineResponse4041Errors, InlineResponse404Errors, Label, Story, TestCaseResult, TestCaseResultStatusEnum, TestPlan, TestPlanCapabilityResult, TestPlanCapabilityResultStatusEnum, TestPlanResult, TestPlanResultStatusEnum, UpdateUrlReplacementRequest, UrlReplacement, CapabilityApiAxiosParamCreator, CapabilityApiFp, CapabilityApiFactory, CapabilityApi, ResultApiAxiosParamCreator, ResultApiFp, ResultApiFactory, ResultApi, ScenarioApiAxiosParamCreator, ScenarioApiFp, ScenarioApiFactory, ScenarioApi, ScheduleApiAxiosParamCreator, ScheduleApiFp, ScheduleApiFactory, ScheduleApi, UrlReplacementApiAxiosParamCreator, UrlReplacementApiFp, UrlReplacementApiFactory, UrlReplacementApi } from "./openapi";

class CustomFormData extends FormData {
    append(key: string, filename: any) {
        const blob = readFileSync(filename)
        super.append(key, blob, {filename})
    }
}

export class Client {
    constructor(configDir: string, userAgent: string) {
        const accessToken = getOrThrow(configDir, 'AUTIFY_WEB_ACCESS_TOKEN')
        const basePath = get(configDir, 'AUTIFY_WEB_BASE_PATH')
        const baseOptions = {
            headers: {
                'User-Agent': userAgent,
            }
        }
        const configuration = new Configuration({accessToken, basePath, formDataCtor: CustomFormData, baseOptions})
        this.capabilityApi = new CapabilityApi(configuration)
        this.resultApi = new ResultApi(configuration)
        this.scenarioApi = new ScenarioApi(configuration)
        this.scheduleApi = new ScheduleApi(configuration)
        this.urlReplacementApi = new UrlReplacementApi(configuration)
    }

    private readonly capabilityApi;

    /**
     * List available Capabilities. 
     * @param {number} projectId For example, 1 for the following URL: https://app.autify.com/projects/1/capabilities
     * @param {string} [os] os name to filter
     * @param {string} [browser] browser name to filter
     * @param {string} [deviceType] device_type name to filter
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CapabilityApi
     */
    listCapabilities(projectId: number, os?: string, browser?: string, deviceType?: string, options?: AxiosRequestConfig) {
        return this.capabilityApi.listCapabilities(projectId, os, browser, deviceType, options)
    }

    private readonly resultApi;

    /**
     * Get a result. 
     * @param {number} projectId For example, 1 for the following URL: https://app.autify.com/projects/1/results/4
     * @param {number} resultId For example, 4 for the following URL: https://app.autify.com/projects/1/results/4
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ResultApi
     */
    describeResult(projectId: number, resultId: number, options?: AxiosRequestConfig) {
        return this.resultApi.describeResult(projectId, resultId, options)
    }

    /**
     * List results. 
     * @param {number} projectId For example, 1 for the following URL: https://app.autify.com/projects/1/results
     * @param {number} [page] The number of page returns.
     * @param {number} [perPage] The number of items returns. Default number is 30 and up to a maximum of 100
     * @param {number} [testPlanId] Test plan ID used to filter results.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ResultApi
     */
    listResults(projectId: number, page?: number, perPage?: number, testPlanId?: number, options?: AxiosRequestConfig) {
        return this.resultApi.listResults(projectId, page, perPage, testPlanId, options)
    }

    private readonly scenarioApi;

    /**
     * Get a scenario. 
     * @param {number} projectId For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios/2
     * @param {number} scenarioId For example, 2 for the following URL: https://app.autify.com/projects/1/scenarios/2
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScenarioApi
     */
    describeScenario(projectId: number, scenarioId: number, options?: AxiosRequestConfig) {
        return this.scenarioApi.describeScenario(projectId, scenarioId, options)
    }

    /**
     * You can execute any scenarios in your workspace using any execution environments (which is called \"capabilities\" here). 
     * @param {number} projectId For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios
     * @param {ExecuteScenariosRequest} executeScenariosRequest The scenarios and settings to execute
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScenarioApi
     */
    executeScenarios(projectId: number, executeScenariosRequest: ExecuteScenariosRequest, options?: AxiosRequestConfig) {
        return this.scenarioApi.executeScenarios(projectId, executeScenariosRequest, options)
    }

    /**
     * List scenarios. 
     * @param {number} projectId For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios
     * @param {number} [page] The number of page returns.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScenarioApi
     */
    listScenarios(projectId: number, page?: number, options?: AxiosRequestConfig) {
        return this.scenarioApi.listScenarios(projectId, page, options)
    }

    private readonly scheduleApi;

    /**
     * Run a test plan. (Note: \"Schedule\" is called as \"TestPlan\" now.) 
     * @param {number} scheduleId For example, 3 for the following URL: https://app.autify.com/projects/1/test_plans/3
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScheduleApi
     */
    executeSchedule(scheduleId: number, options?: AxiosRequestConfig) {
        return this.scheduleApi.executeSchedule(scheduleId, options)
    }

    private readonly urlReplacementApi;

    /**
     * Create a new url replacement for the test plan 
     * @param {number} testPlanId For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15
     * @param {CreateUrlReplacementRequest} createUrlReplacementRequest The url to replace
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UrlReplacementApi
     */
    createUrlReplacement(testPlanId: number, createUrlReplacementRequest: CreateUrlReplacementRequest, options?: AxiosRequestConfig) {
        return this.urlReplacementApi.createUrlReplacement(testPlanId, createUrlReplacementRequest, options)
    }

    /**
     * Delete a url replacement for the test plan 
     * @param {number} testPlanId For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15
     * @param {number} urlReplacementId url_replacement id
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UrlReplacementApi
     */
    deleteUrlReplacement(testPlanId: number, urlReplacementId: number, options?: AxiosRequestConfig) {
        return this.urlReplacementApi.deleteUrlReplacement(testPlanId, urlReplacementId, options)
    }

    /**
     * List url replacements for the test plan 
     * @param {number} testPlanId For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UrlReplacementApi
     */
    listUrlReplacements(testPlanId: number, options?: AxiosRequestConfig) {
        return this.urlReplacementApi.listUrlReplacements(testPlanId, options)
    }

    /**
     * Update a url replacement for the test plan 
     * @param {number} testPlanId For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15
     * @param {number} urlReplacementId url_replacement id
     * @param {UpdateUrlReplacementRequest} updateUrlReplacementRequest The url to replace. Either pattern_url or replacement_url is required.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UrlReplacementApi
     */
    updateUrlReplacement(testPlanId: number, urlReplacementId: number, updateUrlReplacementRequest: UpdateUrlReplacementRequest, options?: AxiosRequestConfig) {
        return this.urlReplacementApi.updateUrlReplacement(testPlanId, urlReplacementId, updateUrlReplacementRequest, options)
    }
}