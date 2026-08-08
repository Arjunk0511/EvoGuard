from flask import jsonify


def success(data):

    return jsonify({

        "success": True,

        "data": data

    })


def error(message):

    return jsonify({

        "success": False,

        "message": message

    }), 400