import math
import numpy as np
import pandas as pd


class BehavioralFeatureExtractor:

    def __init__(self):
        pass

    @staticmethod
    def safe_mean(values):
        if len(values) == 0:
            return 0.0
        return float(np.mean(values))

    @staticmethod
    def safe_median(values):
        if len(values) == 0:
            return 0.0
        return float(np.median(values))

    @staticmethod
    def safe_std(values):
        if len(values) == 0:
            return 0.0
        return float(np.std(values))

    @staticmethod
    def safe_percentile(values, percentile):
        if len(values) == 0:
            return 0.0

        return float(
            np.percentile(values, percentile)
        )

    @staticmethod
    def safe_skew(values):
        if len(values) < 3:
            return 0.0

        series = pd.Series(values)

        value = series.skew()

        if pd.isna(value) or not np.isfinite(value):
            return 0.0

        return float(value)

    @staticmethod
    def safe_kurtosis(values):
        if len(values) < 4:
            return 0.0

        series = pd.Series(values)

        value = series.kurtosis()

        if pd.isna(value) or not np.isfinite(value):
            return 0.0

        return float(value)

    @staticmethod
    def entropy(values):
        if len(values) == 0:
            return 0.0

        values = np.asarray(values)

        unique, counts = np.unique(
            values,
            return_counts=True
        )

        probabilities = (
            counts / counts.sum()
        )

        return float(
            -np.sum(
                probabilities *
                np.log2(probabilities + 1e-12)
            )
        )

    def extract(self, events):

        if not isinstance(events, list):
            raise ValueError(
                "events must be a list."
            )

        if len(events) == 0:
            raise ValueError(
                "At least one behavioral event is required."
            )

        # --------------------------------------------------
        # NORMALIZE EVENTS
        # --------------------------------------------------

        normalized_events = []

        for event in events:

            if not isinstance(event, dict):
                continue

            event_type = event.get("type")

            if event_type is None:
                continue

            timestamp = event.get(
                "timestamp",
                event.get("time")
            )

            x = event.get("x")
            y = event.get("y")

            normalized_events.append({
                "type": event_type,
                "timestamp": timestamp,
                "x": x,
                "y": y
            })

        if len(normalized_events) == 0:
            raise ValueError(
                "No valid behavioral events found."
            )

        # --------------------------------------------------
        # BASIC COUNTS
        # --------------------------------------------------

        event_count = len(
            normalized_events
        )

        move_events = [
            e for e in normalized_events
            if e["type"] == "mousemove"
        ]

        click_events = [
            e for e in normalized_events
            if e["type"] == "click"
        ]

        press_events = [
            e for e in normalized_events
            if e["type"] == "mousedown"
        ]

        release_events = [
            e for e in normalized_events
            if e["type"] == "mouseup"
        ]

        move_count = len(move_events)
        click_count = len(click_events)

        press_event_count = len(
            press_events
        )

        release_event_count = len(
            release_events
        )

        # --------------------------------------------------
        # COORDINATES
        # --------------------------------------------------

        coordinates = []

        for event in move_events:

            if (
                event["x"] is not None
                and event["y"] is not None
            ):

                try:

                    x = float(event["x"])
                    y = float(event["y"])

                    if (
                        np.isfinite(x)
                        and np.isfinite(y)
                    ):
                        coordinates.append(
                            (x, y)
                        )

                except (
                    TypeError,
                    ValueError
                ):
                    pass

        x_values = [
            point[0]
            for point in coordinates
        ]

        y_values = [
            point[1]
            for point in coordinates
        ]

        x_mean = self.safe_mean(
            x_values
        )

        x_std = self.safe_std(
            x_values
        )

        y_mean = self.safe_mean(
            y_values
        )

        y_std = self.safe_std(
            y_values
        )

        x_range = (
            max(x_values) - min(x_values)
            if x_values
            else 0.0
        )

        y_range = (
            max(y_values) - min(y_values)
            if y_values
            else 0.0
        )

        bounding_box_area = (
            x_range * y_range
        )

        # --------------------------------------------------
        # TIMESTAMPS
        # --------------------------------------------------

        timestamps = []

        for event in normalized_events:

            timestamp = event["timestamp"]

            try:

                timestamp = float(timestamp)

                if np.isfinite(timestamp):
                    timestamps.append(timestamp)

            except (
                TypeError,
                ValueError
            ):
                pass

        timestamps.sort()

        dt_values = []

        for i in range(1, len(timestamps)):

            dt = (
                timestamps[i]
                - timestamps[i - 1]
            )

            if dt > 0:
                dt_values.append(dt)

        # --------------------------------------------------
        # MOVEMENT DISTANCE
        # --------------------------------------------------

        distances = []

        speeds = []

        accelerations = []

        jerks = []

        turning_angles = []

        total_distance = 0.0

        for i in range(1, len(coordinates)):

            x1, y1 = coordinates[i - 1]
            x2, y2 = coordinates[i]

            distance = math.sqrt(
                (x2 - x1) ** 2
                +
                (y2 - y1) ** 2
            )

            distances.append(distance)

            total_distance += distance

        # --------------------------------------------------
        # SPEED
        # --------------------------------------------------

        movement_points = []

        for i in range(1, len(coordinates)):

            x1, y1 = coordinates[i - 1]
            x2, y2 = coordinates[i]

            distance = math.sqrt(
                (x2 - x1) ** 2
                +
                (y2 - y1) ** 2
            )

            if i < len(timestamps):

                dt = (
                    timestamps[i]
                    - timestamps[i - 1]
                )

            else:

                dt = 0

            if dt > 0:

                speed = (
                    distance / dt
                )

                movement_points.append(
                    speed
                )

        speeds = movement_points

        # --------------------------------------------------
        # ACCELERATION
        # --------------------------------------------------

        for i in range(1, len(speeds)):

            if i < len(dt_values):

                dt = dt_values[i]

            else:

                dt = 0

            if dt > 0:

                acceleration = (
                    speeds[i] - speeds[i - 1]
                ) / dt

                accelerations.append(
                    acceleration
                )

        # --------------------------------------------------
        # JERK
        # --------------------------------------------------

        for i in range(1, len(accelerations)):

            if i < len(dt_values):

                dt = dt_values[i]

            else:

                dt = 0

            if dt > 0:

                jerk = (
                    accelerations[i]
                    -
                    accelerations[i - 1]
                ) / dt

                jerks.append(jerk)

        # --------------------------------------------------
        # NET DISPLACEMENT
        # --------------------------------------------------

        if len(coordinates) >= 2:

            x_start, y_start = coordinates[0]
            x_end, y_end = coordinates[-1]

            net_displacement = math.sqrt(
                (x_end - x_start) ** 2
                +
                (y_end - y_start) ** 2
            )

        else:

            net_displacement = 0.0

        if total_distance > 0:

            path_efficiency = (
                net_displacement
                /
                total_distance
            )

        else:

            path_efficiency = 0.0

        # --------------------------------------------------
        # SESSION DURATION
        # --------------------------------------------------

        if len(timestamps) >= 2:

            session_duration = (
                timestamps[-1]
                -
                timestamps[0]
            )

        else:

            session_duration = 0.0

        if session_duration > 0:

            events_per_second = (
                event_count
                /
                session_duration
            )

        else:

            events_per_second = 0.0

        # --------------------------------------------------
        # TURNING ANGLES
        # --------------------------------------------------

        directions = []

        for i in range(1, len(coordinates)):

            x1, y1 = coordinates[i - 1]
            x2, y2 = coordinates[i]

            dx = x2 - x1
            dy = y2 - y1

            if dx == 0 and dy == 0:
                continue

            angle = math.atan2(
                dy,
                dx
            )

            directions.append(angle)

        for i in range(1, len(directions)):

            difference = (
                directions[i]
                -
                directions[i - 1]
            )

            difference = (
                difference + math.pi
            ) % (
                2 * math.pi
            ) - math.pi

            turning_angles.append(
                abs(
                    math.degrees(
                        difference
                    )
                )
            )

        # --------------------------------------------------
        # BUTTON EVENTS
        # --------------------------------------------------

        left_button_events = 0
        right_button_events = 0
        middle_button_events = 0

        for event in normalized_events:

            button = event.get(
                "button"
            )

            if button == 0:
                left_button_events += 1

            elif button == 1:
                middle_button_events += 1

            elif button == 2:
                right_button_events += 1

        button_event_count = (
            left_button_events
            +
            right_button_events
            +
            middle_button_events
        )

        # --------------------------------------------------
        # PAUSE DETECTION
        # --------------------------------------------------

        pause_threshold = 500

        pauses = [
            dt
            for dt in dt_values
            if dt >= pause_threshold
        ]

        pause_count = len(pauses)

        if len(dt_values) > 0:

            pause_ratio = (
                pause_count
                /
                len(dt_values)
            )

        else:

            pause_ratio = 0.0

        mean_pause_duration = (
            self.safe_mean(pauses)
        )

        max_pause_duration = (
            max(pauses)
            if pauses
            else 0.0
        )

        # --------------------------------------------------
        # MOVEMENT / STATIONARY
        # --------------------------------------------------

        stationary_count = sum(
            1
            for distance in distances
            if distance == 0
        )

        if len(distances) > 0:

            stationary_ratio = (
                stationary_count
                /
                len(distances)
            )

        else:

            stationary_ratio = 0.0

        movement_ratio = (
            1.0 - stationary_ratio
        )

        # --------------------------------------------------
        # TURNING STATISTICS
        # --------------------------------------------------

        direction_change_count = sum(
            1
            for angle in turning_angles
            if angle > 10
        )

        sharp_turn_count = sum(
            1
            for angle in turning_angles
            if angle > 90
        )

        large_turn_ratio = (
            sharp_turn_count
            /
            len(turning_angles)
            if turning_angles
            else 0.0
        )

        reverse_direction_ratio = (
            sum(
                1
                for angle in turning_angles
                if angle > 150
            )
            /
            len(turning_angles)
            if turning_angles
            else 0.0
        )

        # --------------------------------------------------
        # VARIATION
        # --------------------------------------------------

        speed_variation = (
            self.safe_std(speeds)
        )

        acc_variation = (
            self.safe_std(
                accelerations
            )
        )

        jerk_variation = (
            self.safe_std(
                jerks
            )
        )

        # --------------------------------------------------
        # FINAL 81 FEATURES
        # --------------------------------------------------

        features = {

            "event_count":
                event_count,

            "session_duration":
                session_duration,

            "move_count":
                move_count,

            "click_count":
                click_count,

            "events_per_second":
                events_per_second,

            "total_distance":
                total_distance,

            "net_displacement":
                net_displacement,

            "path_efficiency":
                path_efficiency,

            "x_mean":
                x_mean,

            "x_std":
                x_std,

            "y_mean":
                y_mean,

            "y_std":
                y_std,

            "x_range":
                x_range,

            "y_range":
                y_range,

            "bounding_box_area":
                bounding_box_area,

            "speed_mean":
                self.safe_mean(speeds),

            "speed_median":
                self.safe_median(speeds),

            "speed_std":
                self.safe_std(speeds),

            "speed_min":
                min(speeds)
                if speeds else 0.0,

            "speed_max":
                max(speeds)
                if speeds else 0.0,

            "speed_p25":
                self.safe_percentile(
                    speeds,
                    25
                ),

            "speed_p50":
                self.safe_percentile(
                    speeds,
                    50
                ),

            "speed_p75":
                self.safe_percentile(
                    speeds,
                    75
                ),

            "speed_p90":
                self.safe_percentile(
                    speeds,
                    90
                ),

            "speed_p95":
                self.safe_percentile(
                    speeds,
                    95
                ),

            "speed_skewness":
                self.safe_skew(speeds),

            "speed_kurtosis":
                self.safe_kurtosis(speeds),

            "acc_mean":
                self.safe_mean(
                    accelerations
                ),

            "acc_median":
                self.safe_median(
                    accelerations
                ),

            "acc_std":
                self.safe_std(
                    accelerations
                ),

            "acc_min":
                min(accelerations)
                if accelerations else 0.0,

            "acc_max":
                max(accelerations)
                if accelerations else 0.0,

            "acc_p25":
                self.safe_percentile(
                    accelerations,
                    25
                ),

            "acc_p75":
                self.safe_percentile(
                    accelerations,
                    75
                ),

            "acc_p95":
                self.safe_percentile(
                    accelerations,
                    95
                ),

            "acc_skewness":
                self.safe_skew(
                    accelerations
                ),

            "acc_kurtosis":
                self.safe_kurtosis(
                    accelerations
                ),

            "jerk_mean":
                self.safe_mean(jerks),

            "jerk_median":
                self.safe_median(jerks),

            "jerk_std":
                self.safe_std(jerks),

            "jerk_min":
                min(jerks)
                if jerks else 0.0,

            "jerk_max":
                max(jerks)
                if jerks else 0.0,

            "jerk_p75":
                self.safe_percentile(
                    jerks,
                    75
                ),

            "jerk_p95":
                self.safe_percentile(
                    jerks,
                    95
                ),

            "turn_mean":
                self.safe_mean(
                    turning_angles
                ),

            "turn_std":
                self.safe_std(
                    turning_angles
                ),

            "turn_abs_mean":
                self.safe_mean(
                    turning_angles
                ),

            "direction_change_count":
                direction_change_count,

            "sharp_turn_count":
                sharp_turn_count,

            "dt_mean":
                self.safe_mean(
                    dt_values
                ),

            "dt_median":
                self.safe_median(
                    dt_values
                ),

            "dt_std":
                self.safe_std(
                    dt_values
                ),

            "dt_min":
                min(dt_values)
                if dt_values else 0.0,

            "dt_max":
                max(dt_values)
                if dt_values else 0.0,

            "dt_p25":
                self.safe_percentile(
                    dt_values,
                    25
                ),

            "dt_p75":
                self.safe_percentile(
                    dt_values,
                    75
                ),

            "pause_count":
                pause_count,

            "pause_ratio":
                pause_ratio,

            "mean_pause_duration":
                mean_pause_duration,

            "max_pause_duration":
                max_pause_duration,

            "move_event_count":
                move_count,

            "press_event_count":
                press_event_count,

            "release_event_count":
                release_event_count,

            "left_button_events":
                left_button_events,

            "right_button_events":
                right_button_events,

            "middle_button_events":
                middle_button_events,

            "button_event_count":
                button_event_count,

            "interaction_ratio":
                (
                    button_event_count
                    /
                    event_count
                    if event_count > 0
                    else 0.0
                ),

            "speed_variation":
                speed_variation,

            "acc_variation":
                acc_variation,

            "jerk_variation":
                jerk_variation,

            "stationary_ratio":
                stationary_ratio,

            "movement_ratio":
                movement_ratio,

            "turning_angle_median":
                self.safe_median(
                    turning_angles
                ),

            "turning_angle_p75":
                self.safe_percentile(
                    turning_angles,
                    75
                ),

            "turning_angle_p90":
                self.safe_percentile(
                    turning_angles,
                    90
                ),

            "turning_angle_p95":
                self.safe_percentile(
                    turning_angles,
                    95
                ),

            "large_turn_ratio":
                large_turn_ratio,

            "reverse_direction_ratio":
                reverse_direction_ratio,

            "speed_entropy":
                self.entropy(
                    np.round(
                        speeds,
                        1
                    )
                ),

            "direction_entropy":
                self.entropy(
                    np.round(
                        turning_angles,
                        1
                    )
                )
        }

        return features