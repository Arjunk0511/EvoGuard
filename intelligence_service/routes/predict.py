from flask import Blueprint, request, jsonify

from intelligence_service.services.predictor import (
    BehavioralPredictor
)


# --------------------------------------------------
# BLUEPRINT
# --------------------------------------------------

predict_bp = Blueprint(
    "predict",
    __name__
)


# --------------------------------------------------
# PREDICTOR
# --------------------------------------------------

predictor = BehavioralPredictor()


# --------------------------------------------------
# POST /api/predict
# --------------------------------------------------

@predict_bp.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        # --------------------------------------------------
        # GET REQUEST BODY
        # --------------------------------------------------

        data = request.get_json(
            silent=True
        )

        if data is None:

            return jsonify({
                "success": False,
                "error": "Request body must be valid JSON."
            }), 400


        # --------------------------------------------------
        # GET EVENTS
        # --------------------------------------------------

        events = data.get(
            "events"
        )

        if events is None:

            return jsonify({
                "success": False,
                "error": "Missing 'events' field."
            }), 400


        # --------------------------------------------------
        # VALIDATE EVENTS
        # --------------------------------------------------

        if not isinstance(
            events,
            list
        ):

            return jsonify({
                "success": False,
                "error": "'events' must be a list."
            }), 400


        if len(events) == 0:

            return jsonify({
                "success": False,
                "error": "'events' cannot be empty."
            }), 400


        # --------------------------------------------------
        # RUN BEHAVIORAL PREDICTION
        # --------------------------------------------------

        result = predictor.predict_from_events(
            events
        )


        # --------------------------------------------------
        # RESPONSE
        # --------------------------------------------------

        return jsonify({

            "success": True,

            "service":
                "EvoGuard Intelligence Service",

            "module":
                "Behavioral Intelligence",

            "version":
                "2.0",

            "result":
                result

        }), 200


    # --------------------------------------------------
    # VALIDATION / MODEL ERRORS
    # --------------------------------------------------

    except ValueError as error:

        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 400


    # --------------------------------------------------
    # UNEXPECTED ERRORS
    # --------------------------------------------------

    except Exception as error:

        print(
            "[PREDICT ERROR]",
            str(error)
        )

        return jsonify({

            "success": False,

            "error":
                "Internal prediction error."

        }), 500