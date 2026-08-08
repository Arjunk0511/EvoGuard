from flask import Flask, jsonify
from flask_cors import CORS

from intelligence_service.routes.predict import predict_bp

from intelligence_service.config import (
    HOST,
    PORT,
    DEBUG
)


app = Flask(
    __name__
)

CORS(app)


# Register prediction route
app.register_blueprint(
    predict_bp,
    url_prefix="/api"
)


@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({
        "service": "EvoGuard Intelligence Service",
        "module": "Behavioral Intelligence",
        "version": "2.0",
        "status": "running"
    })


@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({
        "success": True,
        "service": "intelligence_service",
        "status": "healthy"
    })


if __name__ == "__main__":

    print("=" * 60)
    print("EVOGUARD INTELLIGENCE SERVICE")
    print("=" * 60)

    print(
        f"Starting server on "
        f"http://{HOST}:{PORT}"
    )

    app.run(
        host=HOST,
        port=PORT,
        debug=DEBUG
    )