/*
 * Copyright 2017-2019 EPAM Systems, Inc. (https://www.epam.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.epam.pipeline.client.scan;

import com.epam.pipeline.entity.scan.DockerComponentLayerScanResult;
import com.epam.pipeline.entity.scan.DockerComponentScanResult;
import com.epam.pipeline.entity.scan.DockerComponentScanRequest;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;

/**
 * A Retrofit2-based client to interact with DockerCompScan's API
 */
public interface DockerComponentScanService {

    @POST("scan")
    Call<DockerComponentLayerScanResult> scanLayer(@Body DockerComponentScanRequest request);

    @GET("scan/{layer}")
    Call<DockerComponentScanResult> getScanResult(@Path("layer") String layer);

}
