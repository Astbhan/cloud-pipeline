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

package com.epam.pipeline.manager.contextual.handler;

import com.epam.pipeline.entity.contextual.ContextualPreference;
import java.util.List;
import java.util.Optional;

/**
 * Contextual preferences reducer.
 */
public interface ContextualPreferenceReducer {

    /**
     * Tries to merge (reduce) several contextual preferences with the same type
     * into a single contextual preference.
     *
     * @param preferences A list of preference with the same type.
     * @return Reduced contextual preference or empty if the reducer can't handle the given preferences.
     */
    Optional<ContextualPreference> reduce(List<ContextualPreference> preferences);
}